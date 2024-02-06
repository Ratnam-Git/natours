/* eslint-disable */

import axios from "axios";
import { showAlert } from "./alerts";


export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      },
    });

    // console.log(res);
    if (res.data.status = 'success') {
      showAlert('success', 'Signed up Successfully');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};


export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    if (res.data.status = 'success') {
      showAlert('success', 'Logged in Successfully');

      // reloading and going back to home page
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
    console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });

    if (res.data.status = 'success') {
      location.assign('/'); //just forward to the main page
    }

  } catch (err) {
    showAlert('error', 'Error logging out! Try again');
  }
}


