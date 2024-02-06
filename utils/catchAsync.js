module.exports = fn => {
  return (req, res, next) => {  //since this function is called by express, it has access to req, res,next functions
    fn(req, res, next).catch(err => next(err));
  }
}
