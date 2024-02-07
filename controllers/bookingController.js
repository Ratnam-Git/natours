/* eslint-disable no-unused-vars */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) //requiring the stripe package returns a fn in which we have to pass the secret key
const Booking = require('../models/bookingModel');
const Tour = require("../models/tourModel");
const factory = require('./handlerFactory');
const catchAsync = require("../utils/catchAsync");
const User = require('../models/userModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) create checkout session

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
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


const createBookingCheckout = async (session) => {

  const tour = session.client_reference_id //we stored the tour id in the reference_id
  const user = (await User.findOne({ email: session.customer_email })).id; //we only want the id
  const price = session.line_items[0].unit_amount / 100;
  await Booking.create({ tour, user, price });
}


exports.webhookCheckout = (req, res, next) => {
  // reading stripe signature out of header
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    // sending error to stripe
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object) //sending the receive session
  }

  res.status(200).json({ received: true });

}


// this function is called when stripe session returns a success

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;

//   // console.log({ tour, user, price });
//   // console.log(req.originalUrl.split('?')[0]);

//   if (!tour || !user || !price) return next()

//   await Booking.create({ tour, user, price });

//   // redirect creates a new request to the given url
//   res.redirect(req.originalUrl.split('?')[0]); //going to root route
// });


exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);