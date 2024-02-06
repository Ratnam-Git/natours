const express = require('express');
const { signup, login, forgotPassword, resetPassword, updatePassword, protect, restrictTo, logout } = require('../controllers/authController');
const { updateMe, deleteMe, getMe, uploadUserPhoto, resizeUserPhoto } = require('../controllers/userController');
const { getAllUsers,
  createUser,
  getUser,
  updateUser,
  deleteUser } = require(`${__dirname}/../controllers/userController`);



const router = express.Router();


router.post('/signup', signup);

router.post('/login', login);

router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword); //will only receive email

router.patch('/resetPassword/:token', resetPassword); //will receive token + password

router.get('/me', protect, getMe, getUser); //getMe middleware will set the req.params.id to logged in user's id


// From here on all routes will be protected

// using the property of middleware
router.use(protect) //this will protect all the other routes which comes after this

router.patch('/updateMyPassword', updatePassword);

router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe); //we use the upload to create a middleware and the specify the name of the field which is going to hold this file

// using delete HTTP method
router.delete('/deleteMe', deleteMe);

router.use(restrictTo('admin')); //now all the below routes are not only protected, but also restricted 

router
  .route('/')
  .get(getAllUsers)
  .post(createUser);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;