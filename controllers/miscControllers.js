import AppError from "../utils/errorutils.js";
import SendEmail from "../utils/SendEmail.js";
import User from '../models/usermodel.js'

export const contactUs = async (req, res, next) => {
    const { name, email, message } = req.body;

    // Log incoming request data for debugging
    console.log("Received Contact Us Request:", { name, email, message });
  
    if (!name || !email || !message) {
        return next(new AppError('Name, Email, and Message are required', 400));
    }
  
    try {
        const subject = 'Contact Us Form';
        const textMessage = `${name} - ${email}\n\n${message}`;
        
        console.log("Attempting to send email...");
        await SendEmail(process.env.CONTACT_US_EMAIL, subject, textMessage);
        console.log("Email sent successfully.");

        res.status(200).json({
            success: true,
            message: 'Your request has been submitted successfully',
        });
    } catch (error) {
        console.error('Error sending email:', error);
        return next(new AppError('Failed to send email', 500));
    }
};

export const userStats = async (req, res, next) => {
    try {
        const allUsersCount = await User.countDocuments();
        const subscribedUsersCount = await User.countDocuments({
            'subscription.status': 'active',
        });

        console.log("User stats retrieved successfully:", { allUsersCount, subscribedUsersCount });
  
        res.status(200).json({
            success: true,
            message: 'All registered users count',
            allUsersCount,
            subscribedUsersCount,
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        return next(new AppError('Failed to fetch user stats', 500));
    }
};
