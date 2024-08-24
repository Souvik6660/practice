import jwt from 'jsonwebtoken';
import AppError from '../utils/errorutils.js';
import User from '../models/usermodel.js';

export const isLoggedIn = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      return next(new AppError('Unauthenticated, Please login again', 401));
    }

    const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(userDetails.id).populate('subscription');
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    req.user = user;
    console.log('User details:', req.user); // Debugging line
    next();
  } catch (error) {
    return next(new AppError('Invalid token, Please login again', 401));
  }
};

export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to view this route', 403));
  }
  next();
};

export const authorizeSubscribers = (req, res, next) => {
  try {
    const user = req.user;
    console.log('Authorize Subscribers User:', user); // Debugging line

    if (user.role !== 'ADMIN' && user.subscription.status !== 'active') {
      return next(new AppError('Please subscribe to access this route.', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};
