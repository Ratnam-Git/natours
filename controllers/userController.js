/* eslint-disable no-unused-vars */
const multer = require('multer'); //it is middleware for uploading files  
const sharp = require('sharp'); //image processing library
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

//---Creating a location to save images
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // cb(error, currentFile, anotherCallback)
//     cb(null, 'public/img/users'); //folder where we want to save the images
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// -- it is better to save the to the memory instead of disk
const multerStorage = multer.memoryStorage(); //image will be stored as a buffer


const multerFilter = (req, file, cb) => {
  // Test if the uploaded file is an image
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image!', 400), false)
  }
};

// uploading the image
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo');


// resizing image before upload
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  // image resizing using 'sharp' package

  // this will create an object
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};



// A logged in User can get his info.
exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
}


// exports.getAllUsers = catchAsync(async (req, res) => {
//   const users = await User.find();

//   res.status(200).json({
//     status: 'success',
//     // requestedAt: req.requestTime,
//     results: users.length,
//     data: {
//       users
//     }
//   })
// });


exports.getAllUsers = factory.getAll(User);

exports.updateMe = async (req, res, next) => {

  // console.log(req.file); //'.file' is created by the multer middleware which holds the uploaded photo info
  // console.log(req.body);

  // 1) create error if user POSTS password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates', 400));
  }

  // Update user document

  // we allow only email and name to be altered
  // filtering out unwanted propterties that are not allowed to be updated
  const fileterdBody = filterObj(req.body, 'name', 'email');
  if (req.file) fileterdBody.photo = req.file.filename //sotring only the path of the image and not the image itself

  // using findByIdAndUpdate(id, data,options)
  const updatedUser = await User.findByIdAndUpdate(req.user.id, fileterdBody, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
}


// deleting a user

exports.deleteMe = catchAsync(async (req, res, next) => {
  // also for only logged in users
  await User.findByIdAndUpdate(req.user._id, {
    active: false
  })

  // 204 => deleted
  res.status(204).json({
    status: 'success',
    data: null
  })
})



exports.createUser = (req, res) => {
  res.status(500).json({ status: 'error', message: 'This route is not yet defined! Please use signUp instead' });
};

exports.getUser = factory.getOne(User);


// do not update passwords with this
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);