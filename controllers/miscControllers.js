import AppError from "../utils/errorutils.js";
import SendEmail from "../utils/SendEmail.js";
import User from '../models/usermodel.js'

export const contactUs = async (req, res, next) => {
    const { name, email, message } = req.body;

    // Log incoming request data for debugging
    console.log("Received Contact Us Request:", { name, email, message });

    // Validate the request body
    if (!name || !email || !message) {
        console.error("Validation Error: Missing required fields");
        return res.status(400).json({
            success: false,
            message: 'Name, Email, and Message are required',
        });
    }

    try {
        const subject = 'Contact Us Form Submission';
        const textMessage = `From: ${name} <${email}>\n\nMessage:\n${message}`;

        console.log("Attempting to send email...");
        await SendEmail(process.env.CONTACT_US_EMAIL, subject, textMessage);
        console.log("Email sent successfully.");

        // Send a success response
        res.status(200).json({
            success: true,
            message: 'Your request has been submitted successfully',
        });
    } catch (error) {
        console.error('Error sending email:', error);

        // Send an error response
        res.status(500).json({
            success: false,
            message: 'Failed to send email. Please try again later.',
        });
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
