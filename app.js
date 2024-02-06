/* eslint-disable no-unused-vars */
const path = require('path'); //used to manipulate path names
const express = require('express');
const compression = require('compression');
const morgan = require('morgan'); //used to log the incoming request automatically
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//------ creating the app variable
const app = express();


// Telling express what template module we are gonna use
//no need to require 'pug'
app.set('view engine', 'pug');

// we need to define where these views are location in the file system
// views in express
app.set('views', path.join(__dirname, 'views')); //automatically joins the dirname and views



// ---SERVING STATIC FILES (from a folder) USING EXPRESS MIDDLEWARE---

// if we want to access file (such as html) using a browser, we need to define a route for that
// app.use(express.static(`${__dirname}/public/`)) //it will serve all the files to the browser and files can be accessed by adding the filename into the url
app.use(express.static(path.join(__dirname, 'public')));
// no need to write 'public' in url otherwise it will look for the route.
// if any route is not defined, express automatically goes to the public folder and serves the content


// -------GLOBAL MIDDLEWARES---------//



// ---CREATING SECURE HTTP HEADERS--
// app.use(helmet()); //it will automatically set some secure headers
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com/',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/',
  'https://*.stripe.com',
  'https:',
  'data:'
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
  'https:'
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.cloudflare.com/',
  'http://127.0.0.1:3000'
];
const fontSrcUrls = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'https:',
  'data:'
];
const frameSrcUrls = [
  'https://*.stripe.com',
];

app.use(
  helmet({
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
      baseUri: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'data:', 'blob:'],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      fontSrc: ["'self'", ...fontSrcUrls],
      childSrc: ["'self'", 'blob:'],
      frameSrc: ["'self'", ...frameSrcUrls],
      upgradeInsecureRequests: []
    }
  })
);

// A middleware is only called when a request comes up

if (process.env.NODE_ENV === 'development') {
  //---using a 3rd party middleware

  // morgan(how the request log will look like)
  app.use(morgan('dev')) //it automatically calls the next()
  // output => GET /api/v1/tours/ 200 3.460 ms - 8744
}

// app.use() is a middleware that runs for all the routes

// resource specific middlewares can be defined as a simple function and can be used

// Used in POST requests
//------ express puts all the data into the 'middleware' => (a function that modifies an incoming data.) and not in the request's body
//------ include a middleware(express.json()) and use it
//------ app.use() is used to use the middleware
app.use(express.json({ limit: '10kb' }));

//--- using a middleware to parse data coming from form submission
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

//---- Using a middleware to parse the cookie coming from a request

app.use(cookieParser()); //parses the data from the cookie


// ---MIDDLEWARE FOR DATA SANITIZATION against NoSql query injection

app.use(mongoSanitize()); //mongoSanitize() returns a middleware fn which express calls


// ---DATA SANITIZATION against XSS
app.use(xss()) //clean user input from any malicious HTML code


//-----MIDDLEWARE FOR PREVENTING PARAMETER POLLUTION (user's can put same query multiple time which leads to error)

// hpp({whitelist}). whitelist is an array of properties for which we allow duplicate properties
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingAverage', 'maxGroupSize', 'difficulty', 'price']
})); //will only use the last one


//---- creating own middleware
//--- pass the function we want add to the middleware stack
//----- app.use(middleware(req, res,next));
// these apply to every request

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');

// ---- Very imp step
// if next() is not called then request/response cycle will get stuck
//   next();
// });

app.use(compression()) //this will compress all the text that is sent to cliend

app.use((req, res, next) => {
  // this can be used to know when exactly the request happened
  req.requestTime = new Date().toISOString(); //adding current date to req object
  // console.log(req.cookies);
  // Getting access to http headers
  // console.log(req.headers)
  next();
});

// ---CREATING A RATE LIMIT MIDDLEWARE

// will block a certain IP if requests from that IP exceeds the request limit

const limiter = rateLimit({
  // 100reqs/hr
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour!'
});

// defining the route we want to limit
app.use('/api', limiter);




/*
-------ROUTE HANDLERS---------//

--- creating routes

------ http method we want to respond to
------ .get(route, callback(req,res))
app.get('/', (req, res) => {
  ------ sending data back

  ---can only send 1 res.send()
  ------ res.send('Jelly Bean');

  ------ we can send status code along with the response
  ------ res.status(200).send('Jelly Bean, Jelly Bean');

  ------ can send JSON using the JSON() method------
   json() will automatically convert the object to a string
  ------ this will automatically set the content type to 'application/json'
  res.status(200).json([{
    message: 'Jelly Bean, Jelly Bean',
    app: 'Natours'
  }])
});

---- creating a POST route
app.post('/', (req, res) => {
  res.send('You can post to this endpoint.....')
});
*/

//reading the json data
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)); //converts the json into JavaScript Object

// the callback function is called routeHandler

// const getAllTours = (req, res) => { // sending all tours in Jsend JSON formatting syntax i.e status + data 
//   console.log(req.requestTime);
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,
//     results: tours.length, //when sending multiple objects, it's a good practice to include the number of results
//     data: {
//       tours
//     }
//   })
// };

// const getTour = (req, res) => {
//   // console.log(req.params); //{id:5}

//   // const id = Number(req.params.id);
//   const id = req.params.id * 1; //short way to convert a string into a number 

//   const tour = tours.find(el => id === el.id); //find() will contain an array that satisfies the given conditions
//   // console.log(tour);

//   // check for valid id/tour

//   // if (id > tours.length) {
//   if (!tour) {
//     return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   })
// };

// const createTour = (req, res) => {
//   //------ POST => sending data from client to server
//   //------ req object holds all the data
//   //------ with the help of middleware, the message is available on the req.body
//   // console.log(req.body);

//   //---- putting the received data into a file

//   // creating a id
//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);  //assign() creates a new object by merging two objects

//   tours.push(newTour);

//   // -- we need to persist that new tour into the file
//   // we need to stringify the the JSON object
//   fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), (err) => {

//     // 201 => created a new resource
//     res.status(201).json({
//       status: 'success',
//       data: {
//         tour: newTour
//       }
//     });
//   })

//   // -- need to send a response in order to finish the request-response cycle
//   // res.send('Done')
// };


// const updateTour = (req, res) => {

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated tour here>'
//     }
//   })
// };

// const deleteTour = (req, res) => {

//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
//   }
//   res.status(204).json({  //--RESPONSE FOR DELETING data = 204(No content)
//     status: 'success',
//     data: null
//   })
// }

// -------USERS---------//
// const getAllUsers = (req, res) => {
//   res.status(500).json({ status: 'error', message: 'This route is not yet defined' });
// };

// const createUser = (req, res) => {
//   res.status(500).json({ status: 'error', message: 'This route is not yet defined' });
// };

// const getUser = (req, res) => {
//   res.status(500).json({ status: 'error', message: 'This route is not yet defined' });
// };

// const updateUser = (req, res) => {
//   res.status(500).json({ status: 'error', message: 'This route is not yet defined' });
// };

// const deleteUser = (req, res) => {
//   res.status(500).json({ status: 'error', message: 'This route is not yet defined' });
// };

// app.get('/api/v1/tours', getAllTours);


//------DYNAMIC routing-------

//  defining a route which accepts a variable / parameter
//----- a variable is defined using ":"

//------ we can make a parameter optional by '?'
// here req.params = {id:5,x:sda,y:jd}

// req.params is where all the parameters that the url has are stored
// it automatically assigns the url parameters to our created variable
// app.get('/api/v1/tours/:id/:x?/:y?', (req, res) => {})

// app.get('/api/v1/tours/:id?', getTour);


//---- adding a POST route

// app.post('/api/v1/tours', createTour);


//-----HANDLING PATCH/PUT REQUESTS------(update data)
// PATCH updates only selected properties(PREFERRED)
// In PUT, the application receives the entire new updated object

// app.patch('/api/v1/tours/:id', updateTour);


// -----DELETE REQUESTS------

// app.delete('/api/v1/tours/:id', deleteTour);

//------CHAINING METHODS-----
// app.route() helps us to chain defferent http methods
// useful when version of api keeps changing. For one version we can chain methods. eg:
// This can be done using app.route().get().post().patch().delete()
// we define a route and then chain methods on it

// -------ROUTES---------//

// -----CREATING MULTIPLE ROUTERS(MOUNTING THE ROUTER)--------//

// creating one router for each resources .
// const tourRouter = express.Router(); //created a new router for tours
// const userRouter = express.Router();


// tourRouter
//   .route('/') //here the root is already defined in tourRouter(/api/v1/tours)
//   .get(getAllTours)
//   .post(createTour);

// tourRouter
//   .route('/:id?')
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// userRouter
//   .route('/')
//   .get(getAllUsers)
//   .post(createUser);

// userRouter
//   .route('/:userId?')
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);


// we use get() for rendering pages in the browser
// app.get('/', (req, res) => {
// express will automatically go to the folder where 'base' is created
//we use the render method for rendering the template
//to pass data into the template,we need to define an object as 2nd arg in render
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'Jonas'
//   })
// });


// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', { //All these options are also availabe in the base layout too. Not only in that page where render is called
//     title: 'All tours'
//   });
// });

// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker'
//   });
// });

// to actually connect this router to the application, we need to make it a middleware

app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter)//we created a sub-application

app.use('/api/v1/users', userRouter);

app.use('/api/v1/reviews', reviewRouter);

app.use('/api/v1/bookings', bookingRouter);
// ----HANDLING UNHANDLED ROUTES----
//if the code reaches till here this means, the above routes did not catch the request, therefore we need to handle the invalid routes

// handle all the routes(get(),post())
// using app.all(). '*' means all the url's
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server!` //originalUrl => the url requested
  // });
  // next();

  // creating an error:
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); //anything we pass into next will be error. Inbuild in express(Anywhere in the application)
});


//-----BUILDING AN ERROR MIDDLEWARE FUNCTION------
// where all the errors will be handled
// this middleware is an error-first fn

// app.use((err, req, res, next) => { //declaring 4 params, express will already know it's a error handling middleware
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error';

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   });
// })

app.use(globalErrorHandler);

// -------START SERVER---------//

module.exports = app;

// const port = 3000;

// listen(port, callback)
// app.listen(port, () => {
//   console.log(`listening on port ${port}...`);
// })