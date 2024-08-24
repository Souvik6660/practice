import nodemailer from 'nodemailer';
import path from 'path';

// async..await is not allowed in global scope, must use a wrapper
const SendEmail = async function (email, subject, message) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Resolve the correct path to the attachment
  const attachmentPath = path.resolve('E:/LMS/server/models/sagar.jpeg');

  // send mail with defined transport object
  await transporter.sendMail({
    from: `SAGAR ACADEMY <${process.env.SMTP_FROM_EMAIL}>`, // sender address
    to: email, // user email
    subject: subject, // Subject line
    html: `${message} <br><img src="cid:sagar@108gmail.com"  style="width: 200px;" />`, // html body with the embedded image
    attachments: [
      {
        filename: 'sagar.jpeg',
        path: attachmentPath,
        cid: 'sagar@108gmail.com' // same cid as in the html img src
      }
    ]
  });
};

export default SendEmail;
