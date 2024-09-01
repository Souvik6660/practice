import nodemailer from 'nodemailer';

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

  // Send mail with defined transport object
  try {
    await transporter.sendMail({
      from: `SAGAR ACADEMY <${process.env.SMTP_FROM_EMAIL}>`, // sender address
      to: email, // recipient address
      subject: subject, // Subject line
      html: message // HTML body
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

export default SendEmail;
