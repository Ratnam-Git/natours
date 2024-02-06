const dotenv = require('dotenv');
const mongoose = require('mongoose');


// uncaught exceptions => errors that occur in synchronous code, but not handled anywhere
// we listen to the uncaughtException

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥💥');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app');

// -----ENVIRONMENT VARIABLES -----

// type of global variable that are used to define the environment in which the app is running
// console.log(app.get('env')); //development

// SETTING AN ENVIRONMENT VARIABLE:
// WAY1: TERMINAL
// using the terminal we can set an environment variable "NODE_ENV" which is used to tell if we are in development or production mode
// for development : SET NODE_ENV=development&&nodemon server.js

// WAY2: SETTING A CONFIGURATION FILE(cofig.env)
// connect the env file using npm package dotenv
// dotenv.config({path of config.env})
dotenv.config({ path: './config.env' });

// all environment variables set by node:
// console.log(process.env); //process is a core module(global)


// ------USING MONGOOSE-------
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// connect(connection string,options object)
//it returns a promise

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(() => {
  // console.log(con.connections);
  console.log('DB connection successfully established!');
});


//--- creating a document from the model
// new tour({data})
// const TestTour = new Tour({
// name: "The Park Camper",
// rating: 4.7,
//   price: 497
// })


// we can use different methods available on the testTour object

// .save() will insert the document into the db
// returns a promise
// TestTour
//   .save()
//   .then(doc => {
//     console.log(doc);
//   })
//   .catch(err => {
//     console.log('Error 💥💥:', err);
//   });

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});


//-- Handling rejected Promises globally--

// we can subscribe to the unhandledRejection event which comes up everytime a rejected promise occurs
process.on('unhandledRejection', (err) => {
  console.log('UNCAUGHT REJECTION! 💥💥');
  console.log(err.name, err.message);
  console.log(err);
  server.close(() => {
    process.exit(1); //1 stands for uncaught exception, 0 stands for success
  })
});