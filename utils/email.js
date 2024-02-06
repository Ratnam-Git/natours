/* eslint-disable no-unused-vars */
// Sending email using Node.js => nodeMailer

const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text')

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Ratnam <${process.env.EMAIL_FROM}>`
  }

  newTransport() {
    //using SendInBlue service
    return nodemailer.createTransport({
      service: 'SendinBlue',
      port: process.env.SENDINBLUE_PORT,
      auth: {
        user: process.env.SENDINBLUE_USERNAME,
        pass: process.env.SENDINBLUE_PASSWORD
      }
    });
  };

  // sends the actual email
  async send(template, subject) {
    // render HTML based on a PUG template
    // we do not want to render the template but send html created from the template as email
    // pug.renderFile('') takes a file and changes it into HTML
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    })

    // define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // converting html to text
      text: htmlToText(html),
    };

    // create a transport and send email
    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the natours group!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Your password reset token(valid for only 10 minutes)');
  }

}

// const sendEmail = async options => {
// 1. Create a transporter(it will actually send the email, not node)
// using createTransport({options})

// for gmail
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD
//   }
// })

// For development, we use mailTrap that catches the email that we send to clients
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false,
//   logger: true,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

// 2. Define the email options
// const mailOptions = {
//   from: 'Ratnam <ratnampathak5505@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
//   // html:
// };

// 3. Send the email
// await transporter.sendMail(mailOptions)
// }

// module.exports = sendEmail;