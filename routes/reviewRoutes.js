/* eslint-disable no-unused-vars */
const express = require('express');
const { getAllReviews, createReview, deleteReview, updateReview, setTourUserIds, getReview } = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');


// mergeParams:true enables us to access the params coming from different route.We are forwarding the tourId from the tour route to the review route
// POST /tour/lfhdkjlava/review

const router = express.Router({ mergeParams: true }); //this will merge all the params coming from other routes to the / route

router.use(protect); //from this point no one can access these routes without being authenticated

router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;