/* eslint-disable no-unused-vars */
const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");


exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking') {
    res.locals.alert = "Your booking was successful! Please check your email for confirmation. If your booking doesn't show up immediately, please come back later.";
  }
  next();
}



exports.getOverview = catchAsync(async (req, res, next) => {

  // 1) Get tour data from collection
  const tours = await Tour.find();
  // console.log(tours);
  // 2) Build template

  // 3)Render template using the data

  res.status(200).render('overview', { //All these options are also availabe in the base layout too. Not only in that page where render is called
    title: 'All tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {

  // 1. get data
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });


  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // console.log(tour);
  // 2. Build template

  // 3. render template using data
  res.status(200).render('tour', {
    title: tour.name,
    tour
  });
});


exports.getLoginForm = (req, res) => {
  res.status(200)
    .set(
      'Content-Security-Policy',
      "connect-src 'self' http://localhosts:3000/"
    )
    .render('login', {
      title: 'Log into your account'
    })
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign up for an account'
  })
};


exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  })
};


exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log('UPDATING USER', req.body); //need a middleware to parse form data coming from form submission

  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email,
  },
    {
      new: true,
      runValidators: true
    });

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser //as the template accesses data from req.locals.user, we need to update the user
  });

});


exports.getMyTours = catchAsync(async (req, res, next) => {
  // find all bookings of the logged in user
  const bookings = await Booking.find({ user: req.user.id });

  // find tours with returned id
  const tourIds = bookings.map(el => el.tour); //tour contains the id's
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My tours',
    tours
  })
});