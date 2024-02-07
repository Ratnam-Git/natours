const express = require('express');
const { getOverview, getTour, getLoginForm, getSignupForm, getAccount, updateUserData, getMyTours, alerts } = require('../controllers/viewsController');
const { isLoggedIn, protect } = require('../controllers/authController');
// const { createBookingCheckout } = require('../controllers/bookingController');
const router = express.Router();


/* TEST
router.get('/', (req, res) => {
  express will automatically go to the folder where 'base' is created
  we use the render method for rendering the template
  to pass data into the template,we need to define an object as 2nd arg in render
 
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'Jonas'
  })
});
*/




// router.get('/overview', (req, res) => {
//   res.status(200).render('overview', { //All these options are also availabe in the base layout too. Not only in that page where render is called
//     title: 'All tours'
//   });
// });

// router.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker'
//   });
// });

router.use(alerts);


router.get('/', isLoggedIn, getOverview);

router.get('/login', isLoggedIn, getLoginForm);


router.get('/me', protect, getAccount);

router.get('/my-tours',
  // createBookingCheckout,
  protect,
  getMyTours);


router.get('/signup', isLoggedIn, getSignupForm);

router.get('/tour/:slug', isLoggedIn, getTour);


router.post('/submit-user-data', protect, updateUserData);

module.exports = router;