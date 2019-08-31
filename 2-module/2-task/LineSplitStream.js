const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);

    this.encod = options.encoding;
  }

  _transform(chunk, encoding, callback) {
    let data = chunk.toString(this.encod);
    if (this.last) data = this.last + data;
    const lines = data.split(os.EOL);
    this.last = lines.pop();

    lines.forEach((line) => this.push(line));
    callback();
  }

  _flush(callback) {
    if (this.last) this.push(this.last);
    this.last = '';
    callback();
  }
}

module.exports = LineSplitStream;
