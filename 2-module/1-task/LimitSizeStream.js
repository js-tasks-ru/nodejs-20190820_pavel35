const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    super(options);
    this.limit = options.limit || Infinity;
    this.size = '';
  }

  _transform(chunk, encoding, callback) {
    this.size += chunk;
    if (Buffer.byteLength(this.size) > this.limit) {
      callback(new LimitExceededError());
    } else {
      this.push(chunk);
      callback();
    }
  }
}

module.exports = LimitSizeStream;
