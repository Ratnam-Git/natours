/* eslint-disable no-unused-vars */
const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`));


//use of middleware
// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({ status: 'fail', message: 'Invalid ID' }); //very important to return after sending the response
//   }
//   next();
// }


// exports.checkBody = ((req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({ status: 'fail', message: 'Missing name or price' });
//   }
//   next();
// })



const multerStorage = multer.memoryStorage(); //image will be stored as a buffer


const multerFilter = (req, file, cb) => {
  // Test if the uploaded file is an image
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image!', 400), false)
  }
};


const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// when only one image => upload.single('image') //=> present in req.file
// when no cover image => upload.array('images',5) //=> present in req.file


// We need to store multipe images

// it will be present in req.files
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, //we can only have one field with imagecover
  { name: 'images', maxCount: 3 }
])

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // imp step
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // image resizing using 'sharp' package and returns a promise

  // this will create an object

  // CoverImage
  await sharp(req.files.imageCover[0].buffer) //image will be present in the req.files.(fileName).buffer
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // Images

  req.body.images = [];

  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);
    req.body.images.push(filename);
  }));

  // console.log(req.body);
  next();

})


exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}

// ----GETTING ALL TOURS-----

// exports.getAllTours = catchAsync(async (req, res, next) => {
// try {

// --FILTERING DATA BASED ON QUERIES----

// reacting to query strings in the url. eg: 127.0.0.1:3000/api/v1/tours?duration=5&diffculty=easy&sort=1
// here the query string is duration=5 and diffculty=easy
// this is implemented only to route which gets all the tours
// using req.query

//const queryObj = { ...req.query }; //creating a hard copy of the object

//const excludedFields = ['page', 'sort', 'limit', 'fields']; //there are the queries we want to exclude from the filter parameters of the db


// Filtering
//excludedFields.forEach(el => delete queryObj[el]); //deleting excludedFields from the object

//---- Advanced filtering

//desired query:  {difficulty: 'easy',duration: {$gte: 5}}
// we need to replace gte,gt,lte,lt
// what we get from req.query: { difficulty: 'easy', sort: '1', limit: '10', duration: { gte: '5' } } (difference is '$')
//let queryString = JSON.stringify(queryObj);

// using regular expressions
//queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
// console.log(JSON.parse(queryString));

//console.log(req.query); //returns an object ({ duration: '5', difficulty: 'easy' })
// console.log(req.query, queryObj); 

// METHOD 1:const tours = await Tour.find().where('duration').equals(req.query.duration * 1).where('difficulty').equals(req.query.difficulty);

// METHOD 2 : 
// getting all tours from the database
// Tour.find() will return all the documents in that collection
// const tours = await Tour.find({
//   duration: req.query.duration * 1,
//   difficulty: req.query.difficulty
// }); //it return an array of all the documents in that collection and converts them into JSON

// short method
// every method on db's returns a query which can be chained
// const query = Tour.find(queryObj);
//let query = Tour.find(JSON.parse(queryString));

// how to use special characters in the url such as >,< etc? 127.0.0.1:3000/api/v1/tours?difficulty=easy&sort=1&limit=10&duration[gte]=5
// we use [] bracket to insert special operators

// ----SORTING---
// if (req.query.sort) {
// sort the results based on the value
// sort(price)
//if prices are same, we need a second criteria if passed in the url
//url with multiple conditions can be defined as: 127.0.0.1:3000/api/v1/tours?duration=5&sort=price,ratingAverage,difficulty
// sort(price ratingsAverage)
// const sortBy = req.query.sort.split(',').join(' ');
// console.log(sortBy);
// query = query.sort(sortBy); //mongoose will automatically sort the results based on the req.query.sort's value
// } else {
// query = query.sort('-createdAt');
// }

// FIELD LIMITING(SAVE BANDWIDTH)
//  127.0.0.1:3000/api/v1/tours?fields=name,duration,difficulty,price

// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');

// query = query.select('name duration price'). select() will only select those fields with given conditions
//   query = query.select(fields);
// } else {
//   query = query.select('-__v'); //this will exclude the '__v' field and not return to the user
// }


//--- IMPLEMENTING PAGINATION-----

// default pagination 
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;

// methods available for pagination => skip().limit() . limit() will define the data displayed on the page
// page=2&limit=10 => user need page 2 with 10 results per page
// page1-10=>1;11-20=>page2;21-30=>page3 and so on
// we want to skip 10 results before we start querying 

// query = query.skip(10).limit(10) 
// query = query.skip(skip).limit(limit)

// validatin number of pages
// if (req.query.page) {
//   const numTours = await Tour.countDocuments(); //returns a promise with number of documents

//   if (skip >= numTours) throw new Error('This page does not exist');
// }

// const tours = await query;

// using classes
// we need to chain different query methods hence we should use await at the end
// const features = new APIFeatures(Tour.find(), req.query) //we pass all the documents + query we get from the url and chain methods
//   .filter()
//   .sort()
//   .limitFields()
//   .pagination();
// const tours = await features.query;

// res.status(200).json({
//   status: 'success',
//   // requestedAt: req.requestTime,
//   results: tours.length,
//   data: {
//     tours
//   }
// })
// } catch (err) {
//   res.status(404).json({ status: 'error', message: err });
// }
// });


exports.getAllTours = factory.getAll(Tour);



// ------GETTING A TOUR ----

// exports.getTour = catchAsync(async (req, res, next) => {


// using findById() here

// we add the populate() query to add data of the referenced documents into tour db.
// this happens only while querying, not in the db

// const tour = await Tour.findById(req.params.id).populate({
// path: 'guides',
// select: '-__v -passwordChangedAt'
// }); //we populate the field guides which contains the referenct to user's ID's


// const tour = await Tour.findById(req.params.id).populate({
//   path: 'reviews',
//   select: '-id -__v'
// });

// // Tour.findOne({_id: req.params.id})

// if (!tour) {
//   return next(new AppError('No tour found with that ID', 404)); //'return is mandatory'
// }

// res
//   .status(200)
//   .json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });

// try {

// } catch (err) {
//   res.status(404).json({ status: 'error', message: err });
// }

// const tour = tours.find(el => id === el.id);
// if (!tour) {
//   return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
// }
// res.status(200).json({
//   status: 'success',
//   data: {
//     tour
//   }
// })
// });


exports.getTour = factory.getOne(Tour, {
  path: 'reviews',
  select: '-__v -id'
});

// ---CREATING A TOUR--

// exports.createTour = catchAsync(async (req, res, next) => {

//   // const newTour = new Tour({});
//   // newTour.save()


//   //----- Easier way to create a document with mongoose ----
//   // call the create() method right on the model intself, not on the instance of the model
//   // it also returns a promise

//   // Tour.create({}).then(() => {})

//   const newTour = await Tour.create(req.body); //data which is defined in the schema and the body(common) will be created, not others
//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });

//   // try {
//   // create() can accept both objects as well as arrays
//   //     const newTour = await Tour.create(req.body); //data which is defined in the schema and the body(common) will be created, not others
//   //     res.status(201).json({
//   //       status: 'success',
//   //       data: {
//   //         tour: newTour
//   //       }
//   //     });
//   //   } catch (err) {
//   //     res.status(400).json({ status: 'error', message: err });
//   //   }
// });

exports.createTour = factory.createOne(Tour);


// ---UPDATING TOUR

// exports.updateTour = catchAsync(async (req, res, next) => {

//   // try {
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
//   // }

//   // we need to identify the document and update it
//   // it can be using one command in mongoose (findByIdAndUpdate(id, data,new(will return an updated document)));

//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true
//   });

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404)); //'return is mandatory'
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   })
//   // } catch (error) {
//   //   res.status(400).json({ status: 'error', message: 'Invalid data sent' });
//   // }

// });


exports.updateTour = factory.updateOne(Tour); //we pass the model to the factory function to update the document


// ---DELETING A TOUR

// exports.deleteTour = catchAsync(async (req, res, next) => {

//   // try {

//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404)); //'return is mandatory'
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   })
//   // } catch (error) {
//   //   res.status(404).json({ status: 'fail', message: error });
//   // }
// });


exports.deleteTour = factory.deleteOne(Tour); //we pass the model to the factory function to delete the document



//--- AGGREGATION PIPELINE---
// helps to calculate the stats

exports.getTourStats = catchAsync(async (req, res, next) => {
  // try {

  // using aggregate() we can manipulate the data in different steps. We pass an array of stages
  // documents then pass line by line through the stages
  // each stage is an object
  // aggregate() returns a promise of the aggregated result
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } } //basically selects queries above averageRating of 4.5
    },
    {
      $group: {
        // allow us to group documents with the help of an accumulator 
        // calcuating average rating
        // _id: null, //id=> on what we want to group by(eg: average rating of difficult tours(here id is difficulty))
        _id: { $toUpper: '$difficulty' }, //now for each difficulty level, it will calculate the defined properties
        numTours: { $sum: 1 }, //for each document it goes through, it adds 1 and calculates total tours(similar to addition in loop)
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      // Now all the Tours data are gone and only the keys that is defined in the group object's are available
      $sort: { avgPrice: 1 } //we specify the field we want to sort the documents(1 => ascending, -1 => descending)
    },
    // repeating stages
    // {
    // $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });

  // } catch (error) {
  //   res.status(404).json({ status: 'fail', message: error });
  // }
});



exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // try {

  // we want to calculate the busiest month 

  const year = req.params.year * 1; //2021

  const plan = await Tour.aggregate([
    {
      // we can use a stage called 'unwind' => creates a new document for each date in the startDates array
      $unwind: '$startDates'
    },
    // filtering by year
    {
      $match: {
        startDates: {
          // date should be b/w 01-01-2021 && 01-01-2022
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //value of the field we want to extract the month from
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }  //we create an array using '$push'
      }
    },
    {
      $addFields: { month: '$_id' } //adds a field to the document
    },
    // hiding the id field
    {
      $project: {
        _id: 0 //now id will not be shown
      }
    },
    {
      $sort: {
        numTourStarts: -1
      }
    },
    {
      $limit: 12 //will show only 6 documents
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
  // } catch (error) {
  //   res.status(404).json({ status: 'fail', message: error });
  // }
});


// ---Getting tours within a specified locale

// /tours-within/233/center/23.790768, 86.442592/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {

  const { distance, latlng, unit } = req.params;

  //getting coordinates from latlng
  const [lat, lng] = latlng.split(',');

  // radian = distance/radius of earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError('Please provide valid coordinates', 400));
  }

  // console.log(distance, lat, lng, unit);

  // geoWithin: finds documents within a certain geometry
  // we need to find in the sphere where the points are: lat,lng and the radius in the distance
  // centerSphere: [[lng,lat],radius(unit:radian)]

  // We need to index the startLocation in order to access geolocation queries(done in TourModel.js)
  // find returns an array of all the documents
  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  })
});



// function to calculate all tours distance from a coordinate
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(new AppError('Please provide valid coordinates', 400));
  }

  // Using aggregation fn

  const distances = await Tour.aggregate([
    {
      // In geospatial aggregation, we have only one stage : geoNear(always 1st)
      // also requires that atleast one field contains a geospatial index (eg: startLocation: '2dsphere');
      // if only one geospatial index is present, then it becomes the default key
      // Here 2dsphere is the index

      // Hence all the calculation will be from coordinates to startLocation
      $geoNear: {
        // point from where we need to calc dist
        // should be in the format of geoJSON i.e type and coordinates
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1]
        },
        // Here all the calculated distances will be stored
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ])

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  })


})