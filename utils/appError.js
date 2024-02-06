class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //messgae is the only parameter that the build-in error accepts(basically calling Error())
    this.statusCode = statusCode;

    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;