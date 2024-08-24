import AppError from "../utils/errorutils.js";
import SendEmail from "../utils/SendEmail.js";
import User from '../models/usermodel.js'


export const contactUs = async (req, res, next) => {
    // Destructuring the required data from req.body
    const { name, email, message } = req.body;
  
    // Checking if values are valid
    if (!name || !email || !message) {
      return next(new AppError('Name, Email, Message are required'));
    }
  
    try {
      const subject = 'Contact Us Form';
      const textMessage = `${name} - ${email} <br /> ${message}`;
  
      // Await the send email
      await SendEmail(process.env.CONTACT_US_EMAIL, subject, textMessage);
    } catch (error) {
      console.log(error);
      return next(new AppError(error.message, 400));
    }
  
    res.status(200).json({
      success: true,
      message: 'Your request has been submitted successfully',
    });
  };


  export const userStats = async (req, res, next) => {
    const allUsersCount = await User.countDocuments();
  
    const subscribedUsersCount = await User.countDocuments({
      'subscription.status': 'active', // subscription.status means we are going inside an object and we have to put this in quotes
    });
  
    res.status(200).json({
      success: true,
      message: 'All registered users count',
      allUsersCount,
      subscribedUsersCount,
    });
  };