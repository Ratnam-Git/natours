/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

// creating schemas and models for the database

//---- schema is used to describe out data
//---- with the help of a schema we create model(similar to class in JS)

// -- we can define schema type options for each field
// tourSchema defines the schema for Tour documents in MongoDB.
// It specifies the fields, data types, validators, etc. for Tour documents.
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    //we can define different fiels such as error messages, required fields
    required: [true, 'A tour must have a name'], //data validation
    unique: true,
    trim: true,

    // declaring validators
    maxLength: [40, 'A tour name must have less or equal than 40 characters'],
    minLength: [10, 'A tour name must have more or equal than 5 characters'],

    // using 3rd party,npm validators
    // validate: [validator.isAlpha, 'Tour name must only contain characters']  //we do not call
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a maximum group size']
  },
  difficulty: {
    type: String,
    required: [true, 'A tour must have a difficulty'],

    // we need only 3 difficulty values => easy, difficult and medium
    // we use enum data validation (only for strings)
    enum: {
      values: ['easy', 'difficult', 'medium'],
      message: 'Difficulty must be either : easy or difficult or medium'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10 //this will run each time a value is set
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
    type: Number,

    // adding a custom validator: returns a boolean. If true, input is accepted else rejected
    // the function has access to the passed input
    validate: {
      validator: function (val) {

        // 'this' only points to the current doc on NEW document creation
        // not available on update()
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) must be less than the base price' //({VALUE}) will be equal to the input val 
    }
  },
  summary: {
    type: String,
    trim: true,  //removes all the whitespace before and after the string(exclusive for strings)
    required: [true, 'A tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String, //will store the name of the image
    required: [true, 'A tour must have a cover image']
  },
  images: [String],  //we will store the images as an array of strings
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false //this will hide data to the viewers
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  // adding geospatial data => specify an object with two field names: type and coordinates
  startLocation: {
    // GeoJson format(for mongodb)
    // subfields
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'] //this field can take only one type of value
    },
    coordinates: [Number], //[longitued,latitude]
    address: String,
    description: String
  },
  //--- How to model all location documents into the tour schema? By defining an array of objects.

  // By doing this, each location object will get thier own ID and hence modeled into tour schema.

  // Whenever you define an object in an array, Mongoose creates a schema for it behind the scenes so it treats it as a subdocument. A consequence of this is that Mongoose will add an _id field to each object.

  // array of location contains an object for each location
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],

  // ---CONNECTING TOURS AND USERS
  // Method : 1
  // ----Embedding userID's into tour schema
  // ---We store the id's of users into an array and use premiddleware to show user details 

  // guides: Array   //=>  "guides":["65b532b98650bc0d2c2ce127","65b532e88650bc0d2c2ce129"]

  // Method : 2
  // referencing
  // We only give the id's of the Users into the guides array which references to the users

  // By including ref: 'User', you're telling Mongoose that the guides field is a reference to documents in the 'User' collection. Mongoose uses this information to create a relationship between tours and users.
  // No need to import User's model

  // To show guide's data, we need to use populate() in the query handler functions(like getTour())
  guides: [
    {
      type: mongoose.Schema.ObjectId,// expected type in guides array type is MongoooseID
      ref: 'User' //this is how we establish reference b/w diff data sets(referencing to user's schema)
    }
  ]

}, { //to show the virtual properties, we need to pass an options object into the schema fn,
  toJSON: { virtuals: true }, //whenever a document is called in json, virtuals will be included 
  toObject: { virtuals: true }
});


// ---Creating indexes for optimizing queries
// tourSchema.index({ price: 1 }); //1 => ascending || -1 =>descending

// ---compound Indexing
tourSchema.index({ price: 1, ratingsAverage: -1, slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //2dsphere => for geospatial data


// ---VIRTUAL PROPERTIES ------------
// cannot be used in queries(such as filter(),sort())
// properties which can derived from other fields such as km from miles, weeks b/w start and end date
// it will not persist on the database but will be there when we get the data
// tourSchema.virtual('name of virtual property')
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});



// ----IMPLEMENTING VIRTUAL POPULATE

// what if we want to show the reviews when we query for tours?Since the review are using parent referencing, the parent(tour)
// does not know about it's child. Hence we need to use virtual populate which give all the review related to that tour when queries without reviews being stored in the tour schema

tourSchema.virtual('reviews', {
  ref: 'Review', //referencing to Review model

  // specifying name of the fields in order to connect the two data sets
  localField: '_id', //This tour ID is being stored in the review model(we need to specify which field is being stored in the review model)

  foreignField: 'tour' //tour is the name of the field where we store the tour ID's of reviews
});


// ----CREATING MIDDLEWARES IN MONGOOSE ----


// pre() => runs before the event and post() => runs after the event
// 4 types of middleware => document,query,aggregate,model

//---- DOCUMENT middleware = can act on the current processed middleware
// middleware are defined on the schema

// first argument in pre()/post() functions which are 'save' and so on are called 'HOOKS' 


// pre() document middleware
// can be used to create a slug for each document
tourSchema.pre('save', function (next) { //called before the document is save() or create() {Not for update()}
  // console.log(this); //'this' will point to the processed document

  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save the document');
//   next();
// })

//--- post() document middleware, callback has access to doc and next
//--- comes after all the pre() middlewares have been called
//--- no access to 'this'
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// })


// -----Creating a middleware that shows details of referenced user which is into guides array

// this middleware will fetch all the user' data that is into the guides array and show it in the database before a new document is made.

// tourSchema.pre('save', async function (next) {

//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// })


// ---QUERY middleware

// will run before any find() is executed
// we do not want secret tours to appear in the result output
// 'this' is the query object
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) { //all the occurances that start with find => ^find

  // we create a secret tour field and query for tours that are not secret
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});


// ----CREATING A MIDDLEWARE FOR populate() referenced id in db

tourSchema.pre(/^find/, function (next) {

  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  })

  next();
})


// Middleware for post find query

tourSchema.post('find', function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} ms`);
  // console.log(docs);
  next();
});



// ---AGGREGATION middleware
// allows us to add middleware before and after an aggregation happens
// we want to remove secret tour from aggregations

// 'this' points to the current aggregation object
// tourSchema.pre('aggregate', function (next) {
//   // console.log(this);

//   // we need to another 'match' stage at the beginning of the pipeline array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// })



//--- creating a model out of a schema
// model names should start with capital letter
//  the collection name will come from the model name
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
