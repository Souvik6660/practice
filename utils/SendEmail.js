import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory of the module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SendEmail = async function (email, subject, message) {
  // Create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_PORT === '465', // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Resolve the correct path to the attachment
  const attachmentPath = path.resolve(__dirname, 'models', 'sagar.jpeg');

  // Send mail with defined transport object
  try {
    await transporter.sendMail({
      from: `SAGAR ACADEMY <${process.env.SMTP_FROM_EMAIL}>`, // sender address
      to: email, // recipient address
      subject: subject, // Subject line
      html: `${message} <br><img src="cid:sagar@108gmail.com" style="width: 200px;" />`, // HTML body with the embedded image
      attachments: [
        {
          filename: 'sagar.jpeg',
          path: attachmentPath,
          cid: 'sagar@108gmail.com' // same CID as in the HTML img src
        }
      ]
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

export default SendEmail;
