/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";


export const bookTour = async tourId => {
  try {
    const stripe = Stripe('pk_test_51OgTYpSJ7pyw5rLPMzHdMYaQ6LhDOvwPykhJRs7WrbfvLg1CRHALWqgChhjURL3fyIHrFHMZZzxoiO4EaGs8wHlS00RG2vCuZ4');
    // 1) get the session from the server
    const session = await axios({
      method: 'GET',
      url: `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    });

    console.log(session);
    // 2) Use stripe object to create the checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });

  } catch (err) {
    showAlert('error', err);
  }

}