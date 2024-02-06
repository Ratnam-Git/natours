/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please input your name!']
  },
  email: {
    type: String,
    required: [true, 'Please input your email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please input your password!'],
    minLength: [8, 'Password must be at least 8 characters long'],
    select: false //now password will never show up in the output
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password!'],
    // checking password
    // this ONLY WORKS ON .save() || .create()!!!
    // if the result is false, then we get validation error
    validate: {
      validator: function (el) { //function gets access to the current property
        return el === this.password;
      },
      message: 'Passwords do not match'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Implementing password encryption using mongoose middleware

userSchema.pre('save', async function (next) {
  // we want password only to be encrypted when password in created, updated. Not when email,name is updated
  // we use isModified('field')
  if (!this.isModified('password')) return next();

  // encrypting the password
  // using package bcrypt
  this.password = await bcrypt.hash(this.password, 12) //12 is the cost of cpu.

  // delete the confirmPassword field
  // it was just to confirm the input password in equal
  this.passwordConfirm = undefined;
  next();
});

// ---Adding a query middleware

// this will run before a find query is made
userSchema.pre(/^find/, function (next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } }) //only returns queries that has active property set to true
  next();
});



// Specifying password changed at property
userSchema.pre('save', function (next) {
  // check if password in not modified || password is new, then we return
  if (!this.isModified('password') || this.isNew) return next();

  // else define the property
  this.passwordChangedAt = Date.now() - 1000; //1000 is the time in miliseconds(as jwt token is created faster we need to subtract 1000(1sec))
  next();
});


// checking loggedIn password is same as the user password

// using instance Methods => a method that is going to be availabe on all the documents of a certain collection.
// using bcrypt.compare()

// returns true/false
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
}


// Checking if user changed the password

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(this.passwordChangedAt, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  // false  => not changed
  return false;
}

userSchema.methods.createPasswordResetToken = function () {
  // we use the built-in crypto package to generate a token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // creating a hash of the reset token and storing it into the database
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minutes

  // sending the unencrypted token back to the user, so when he goes to the url containing this token,we encrypt it and match it with the token in the db
  return resetToken;
}

// creating model out of the schema
const User = mongoose.model('User', userSchema);

module.exports = User;