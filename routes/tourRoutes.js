
const express = require('express');
const { getTourStats, getAllTours, getTour, createTour, updateTour, deleteTour, aliasTopTours, getMonthlyPlan, getToursWithin, getDistances, uploadTourImages, resizeTourImages } = require('../controllers/tourController');
const { protect, restrictTo } = require('../controllers/authController');
// const { createReview } = require('../controllers/reviewController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();

// also we need the change the route in the '.route' method(IMP as the url is changed)

// Implementing Nested Routes

// in order to get reviews we should not manually enter the userID and tourID. It should come from the url
// This is how the url will look =>
// POST /tour/lfhdkjlava/reviews (POSTING A REVIEW FROM THE LOGGED IN USER TO A TOUR)
// GET /tour/kjhsdfklasjd/reviews (GETTING ALL REVIEWS)
// GET /tour/ahkjlasd/reviews/asdlkjfh (GETTING A PARTICULAR REVIEW)

// It doesn't really belong in the tour route as it is a review resource

// router.route('/:tourId/reviews').post(protect, restrictTo('user'), createReview);

// Solution:
router.use('/:tourId/reviews', reviewRouter); //=> this tour router should use the reviewRouter in case it hits the given URL
// but does not get access to the tourID param




//-------- PARAMETERIZED MIDDLEWARE ---------(it is sort of a listener which is called when a route with 'id' is hit)
// for specific parameterized routes and that resource (will run every time when it hits this route)

// router.param(parameter,middleware(req,res,next,value of parameter))

// Here we are using middleware to check if the id is valid/not
// router.param('id', checkID);


// ----CHAINING MIDDLEWARE-----
//  all callback functions can be called a middleware
//if we want to add a middleware in a method before executing the callback function, we can declare it before the callback

// ----Creating a alias route(route which is often used)
// we need to put this before the :id route otherwise express will treat the route as id
router
  .route('/top-5-cheap')
  .get(aliasTopTours, getAllTours); //we will run a middleware to filter out the params


router.route('/tour-stats').get(getTourStats);

router.route('/monthly-plan/:year').get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

// to enable protected routes, we add a middleware before the controllers that checks if the user is logged in/not

router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin);
// /tours-distance/233/center/-40,45/unit/mi
// 233 => tours within 233 miles


// this route will calculate all tours distance from a given coordinate
router.route('/distances/:latlng/:unit').get(getDistances)


router
  .route('/')
  .get(getAllTours)
  // .get(protect, getAllTours)
  // .post(checkBody, createTour);
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
  .route('/:id?')
  .get(getTour)
  .patch(
    protect
    , restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour)
  .delete(
    protect
    , restrictTo('admin', 'lead-guide')
    , deleteTour);

module.exports = router;