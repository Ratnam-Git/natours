/* eslint-disable*/
import '@babel/polyfill';
import { login, logout, signup } from './login'
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

// DOm elements
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const signupForm = document.getElementById('form--signup');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const fileInput = document.querySelector('.form__upload');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

const userImgEl = document.querySelector('.form__user-photo');
const userImgInputEl = document.querySelector('#photo');
// console.log(logOutBtn);

// delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
};


if (signupForm) {
  // console.log('SIGNUP');
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('nameSignup').value;
    const email = document.getElementById('emailSignup').value;
    const password = document.getElementById('passwordSignup').value;
    const passwordConfirm = document.getElementById('passwordConfirmSignup').value;
    // console.log(name, email, password, passwordConfirm);
    signup(name, email, password, passwordConfirm);
  });
}


if (loginForm) {

  loginForm.addEventListener('submit', (e) => {

    e.preventDefault();
    // console.log(email, password);
    // values
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
};

if (logOutBtn) {
  // console.log('LOGOUT');
  logOutBtn.addEventListener('click', logout);
}



if (bookBtn) {
  // console.log('Book btn');
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...'
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  })
}


if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();

    // recreating a multi-part form data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    // form.append('photo', document.getElementById('photo').files[0]);
    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    console.log(form);
    updateSettings(form, 'data');
  })
};


if (fileInput)
  fileInput.addEventListener('change', async (e) => {
    const form = new FormData();
    form.append('photo', document.getElementById('photo').files[0]);

    // Take care of the type attribute being photo
    const newImage = await updateSettings(form, 'photo');

    if (newImage) {
      document
        .querySelector('.nav__user-img')
        .setAttribute('src', `/img/users/${newImage}`);
      document
        .querySelector('.form__user-photo')
        .setAttribute('src', `/img/users/${newImage}`);
    }
  });


if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  })
};



const handleDisplayUserPhoto = e => {
  const imgFile = e.target.files?.[0];

  if (!imgFile?.type.startsWith('image/')) return;
  const reader = new FileReader();

  reader.addEventListener('load', () => {
    userImgEl.setAttribute('src', reader.result);
  });

  reader.readAsDataURL(imgFile);
};

userImgInputEl.addEventListener('change', handleDisplayUserPhoto);


