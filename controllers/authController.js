/* eslint-disable no-unused-vars */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email')


const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}


// cookie => small piece of text that a server can sent to clients, and when client receives a cookie it will automatically store it and automatically send it back along with all future requests to the same server
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // sending a cookie
  // res.cookie(name,data we want to send in the cookie,options)

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    // secure: true, //cookie will be sent only through https(only want when we are in production)
    httpOnly: true //cannot be access or modified in anyway by the browser
  }
  if (process.env.NODE_ENV === 'production') { cookieOptions.secure = true }
  res.cookie('jwt', token, cookieOptions)

  // Remove password from output while creating new users
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    // SENDING THE TOKEN BACK TO THE CLIENT
    token,
    data: {
      user
    }
  });
}

exports.signup = catchAsync(async (req, res, next) => {

  // this way will enable us to store the data that we need, not the data that the user input
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });


  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  // loggin in user as soon as they are signed up
  // usign jwt web token
  //  we sent a token to the user telling that they are validated
  // token headers are created automatically

  // jwt.sign(payload(object of all data we store in the token), 'secret string',{options})
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });


  createSendToken(newUser, 201, res);

  // const token = signToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   // SENDING THE TOKEN BACK TO THE CLIENT
  //   token,
  //   data: {
  //     user: newUser
  //   }
  // });
});


// implementing login feature
// should only work if user already exists and password is correct

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //  1. check email and pass is provided 
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. check if user and password is in the Database
  // since we hid the password from the db, we need to explicitly select the password
  const user = await User.findOne({ email }).select('+password');
  // console.log(user); //this returns the object containing the user and the password stored in the db if found


  // ---comparing passwords
  // we compare the input password with the hash pass using the bcrypt package
  // const correct = await user.correctPassword(password, user.password);
  // only check when user is defined


  if (!user || !await user.correctPassword(password, user?.password)) {
    return next(new AppError('Incorrect email or password', 401)); //401 => unauthorized
  }

  // 3. if all ok, create a token and send it back to the client
  // we need to create a new token for logging in


  createSendToken(user, 200, res);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token
  // });
})


// Adding a logout controller

// we send another cookie on click of logout button but without any token and negligible expiration time.
// By this, the present cookie will be overriden and the user will be logged out as their is no user to be extracted

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' })
}



//-- creating a auth middleware fn

exports.protect = catchAsync(async (req, res, next) => {

  // ---1. Getting token from the request and check if it exists
  let token;

  // header will be along with the request
  // req.header.authorization LOOKS LIKE => Bearer TOKEN
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // we extract the 2nd part of the authorization string
    token = req.headers.authorization.split(' ')[1];
  }
  // checking for jwt token in the cookies
  else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }


  // console.log(token);

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access', 401));
  }

  // 2. Verify token
  // jwt.verify(token, secret, callback)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET) //by this way we don't need to declare a callback function like '.then()'


  // console.log(decoded); // this will return the id of the user who is logged in
  // { id: '65b4aa965747d358dccd5f6e', iat: 1706338990, exp: 1714114990 }

  // 3. check if user still exists

  // using the id we get from the decoded token
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist', 401));
  }

  // 4. check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again', 401));
  }

  // GRant access to protected route
  req.user = currentUser //storing the currentUser into a new req.user property
  res.locals.user = currentUser; //exposing the user to pug templates
  next();
});


// This function is only to tell if a user is loggedin or not (for displaying different nav elements
// we do not catchasync here because if logout is triggered, then the token is already of invalid type which will throw error everytime
// hence we need to catch errors locally

exports.isLoggedIn = async (req, res, next) => {

  if (req.cookies.jwt) {

    try {

      // console.log(token);

      // 2. Verify token
      // jwt.verify(token, secret, callback)
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)


      // using the id we get from the decoded token
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 4. check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user => make the user accessible to the templates

      // Whatever we put after res.locals, pug template will treat them as variables and has access to them
      // i.e user as a variable will be accessible in all the pug templates since it also hass access to res.locals
      res.locals.user = currentUser;

      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};



// Implementing Authorization => grant special access to certain special logged in users

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles => ['admin','lead-guide']
    if (!roles.includes(req.user.role)) { //since the protect fn is run before restrictTo, req.user is the currentUser
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  }
};


// Implementing forgot password

exports.forgotPassword = catchAsync(async (req, res, next) => {

  // 1. Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  // 2. Generate a random token
  // createPasswordResetToken() is an instance method i.e available on all user model documents
  const resetToken = user.createPasswordResetToken();

  // we just modified the document hence need to save it
  await user.save({ validateBeforeSave: false }); //this will deactivate all validators we specify in our schema  

  // 3. Send it to user's email
  // getting protocol => req.protocol, getting host => req.get('host')


  // const message = `Forgot your password? Submit a PATCH request with your new password and password Confirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message
    // });

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    // reset both token and expiration property
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email. Try again later', 500));
  }
})

exports.resetPassword = async (req, res, next) => {

  // 1. get user based on the token
  // since the user got the non-encrypted token, we need to encrypt it and then match it in the db and find user
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    // checking token expiry
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2. If token has not expired, and there is a user,set new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3. update changedPassword property for the currentUser

  // 4. Log the use in, send JWT


  createSendToken(user, 201, res);

  // const token = signToken(user._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  // });
}


// making user change password without forgetting it
exports.updatePassword = catchAsync(async (req, res, next) => {
  // only for logged in users

  // 1. Get user from collection
  // we need to explicitly select the password as it is not included in the db
  const user = await User.findById(req.user._id).select('+password'); //since we run this after the protect() middleware, we have access to the current user

  // 2.check if posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3.if yes, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // User.findByIdAndUpdate() will not work , because 'this' is not defined in this method
  // save the user data
  await user.save()

  // 4.log user in, send jwt

  createSendToken(user, 200, res);
});