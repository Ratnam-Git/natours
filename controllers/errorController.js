/* eslint-disable no-unused-vars */
const AppError = require("../utils/appError");

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}. Cast to ObjectId failed`;
  return new AppError(message, 400);
}


const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
}


const handleValidationErrorDB = err => {
  // to loop over JS objects, we can use Object.values()
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}


const handleJWTError = () => new AppError('Invalid token. Please login againg!', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired. Please login again!', 401);

// req.originalUrl = URL but not with host
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Render Website
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });
  }
}
const sendErrorProd = (err, req, res) => {
  // operational,trusted error: send message to cliend

  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      //programming or other unknown error
    }
    // log error
    console.log('ERROR💥💥', err);
    // send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });

  }

  // Render Website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    });

    //programming or other unknown error
  }
  // log error
  console.log('ERROR💥💥', err);
  // send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: "Please try again later."
  });

}


module.exports = (err, req, res, next) => { //declaring 4 params, express will already know it's a error handling middleware
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {

    let error = { ...err }; //message is not beign copied in the object
    error.message = err.message

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (error._message === 'Validation failed') {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
}