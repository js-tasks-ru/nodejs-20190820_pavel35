const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');

const server = new http.Server();

server.on('request', (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filepath = path.join(__dirname, 'files', pathname);

  const limitSizeStream = new LimitSizeStream({limit: 1e6});
  const writeStream = fs.createWriteStream(filepath, {flags: 'wx'});

  writeStream
      .on('error', (err) => {
        if (err.code === 'EEXIST') {
          res.statusCode = 409;
          res.end('File exists');
          return;
        }

        res.statusCode = 500;
        res.setHeader('Connection', 'close');
        res.end('Internal server error');

        fs.unlink(filepath, (err) => {});
      })
      .on('close', () => {
        res.statusCode = 201;
        res.end('File created');
      });

  limitSizeStream.on('error', (err) => {
    if (err.code === 'LIMIT_EXCEEDED') {
      res.statusCode = 413;
      res.setHeader('Connection', 'close');
      res.end('File is too big');

      fs.unlink(filepath, (err) => {});
      return;
    }

    res.statusCode = 500;
    res.setHeader('Connection', 'close');
    res.end('Internal server error');

    fs.unlink(filepath, (err) => {});
  });

  res.on('close', () => {
    if (res.finished) return;
    fs.unlink(filepath, (err) => {});
  });

  if (pathname.includes('/') || pathname.includes('..')) {
    res.statusCode = 400;
    res.end('Nested paths are not allowed');
  }

  if (!filepath) {
    res.statusCode = 404;
    res.end('File not found');
    return;
  }

  if (req.headers['content-length'] > 1e6) {
    res.statusCode = 413;
    res.end('File is too big!');
    return;
  }

  switch (req.method) {
    case 'POST':
      req.pipe(limitSizeStream).pipe(writeStream);
      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
