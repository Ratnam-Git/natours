/* eslint-disable no-unused-vars */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) //requiring the stripe package returns a fn in which we have to pass the secret key
const Booking = require('../models/bookingModel');
const Tour = require("../models/tourModel");
const factory = require('./handlerFactory');
const catchAsync = require("../utils/catchAsync");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) create checkout session

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
  });

  // create session as response
  res.status(200).json({
    status: 'success',
    session
  })
});


exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  // console.log({ tour, user, price });
  // console.log(req.originalUrl.split('?')[0]);

  if (!tour || !user || !price) return next()

  await Booking.create({ tour, user, price });

  // redirect creates a new request to the given url
  res.redirect(req.originalUrl.split('?')[0]); //going to root route
});


exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);