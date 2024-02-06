/* eslint-disable no-unused-vars */

// transferring all the data from tour-simple.json to the database

const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
}).then(con => {
  console.log('DB connection successfully established!');
});

// reading json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'));
// Import data into db

const importData = async () => {
  try {
    await Tour.create(tours); //create() will create a new document for each of the objects in the array
    await User.create(users, { validateBeforeSave: false }); //create() will create a new document for each of the objects in the array
    await Review.create(reviews); //create() will create a new document for each of the objects in the array
    console.log('Data successfully loaded!');
  } catch (err) { console.log(err); }
  process.exit();
};


//--- delete all data from the collection

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) { console.log(err); }
  process.exit();
};

console.log(process.argv); //returns an array of arguments of running node processes

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData();
}

