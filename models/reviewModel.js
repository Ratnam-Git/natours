/* eslint-disable no-unused-vars */

const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Reviews cannot be empty']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  // PARENT REFERENCING
  // In this case the parent does not know about the children
  // no need to declare an array. Simply reference to Parent model
  tour:
  {
    type: mongoose.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour.']
  },
  user:
  {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user.']
  }
},
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


// We are using indexes for limiting reviews i.e only one user can put one review for a tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //combination of tour and user will always have to be unique


// populating user and tour data before review is fetched

reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  // Not showing tours on query of reviews. Not imp
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
})



//---- Implementing a STATIC method on the model---(because we want to create a function directly on the model)

// static functions are available on the model

// calculate the ratings average and number of ratings for a given review
// ---This function calculates the average rating and number of ratings everytime a review is modified on a tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {

  // 'this' points to the current Model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId } //only select the reviews for the matching tourID
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats); //result is stored in an array

  // persisting the calcuated stats into the tour model
  // saving stats to the current tour

  if (stats.length > 0) {

    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  }
  else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
}

reviewSchema.post('save', function () {
  // this points to current review

  // since the model is created after this function, it is not available here
  // Hence we need to use the this.constructor to access the model

  this.constructor.calcAverageRatings(this.tour); //this.constructor points to the current model

});


// we need to run the calcAverageRatings() on update and delete

// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {

  // this is query middleware, hence 'this' points to the query object.But we need to point 'this' to the document.
  // Hence we use the trick 'findOne' which returns the current document
  this.r = await this.findOne();
  // console.log(this.r);
});

// Now we want to persist the changes in the document and 

reviewSchema.post(/^findOneAnd/, async function () {
  // this.r = await this.findOne(); does not work here, query has already been executed

  await this.r.constructor.calcAverageRatings(this.r.tour);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;


