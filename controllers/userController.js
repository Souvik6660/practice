import AppError from "../utils/errorutils.js";
import User from "../models/usermodel.js";
import fs from 'fs/promises';
import cloudinary from 'cloudinary';
import SendEmail from "../utils/SendEmail.js";
import crypto from 'crypto'; // For ES6 import syntax




const cookieOptions = {
  secure: process.env.NODE_ENV === 'production' ? true : false,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
};




export const register = async (req, res, next) => {
  // Destructuring the necessary data from req object
  const { fullName, email, password } = req.body;

  // Check if the data is there or not, if not throw error message
  if (!fullName || !email || !password) {
    return next(new AppError('All fields are required', 400));
  }

  // Check if the user exists with the provided email
  const userExists = await User.findOne({ email });

  // If user exists send the reponse
  if (userExists) {
    return next(new AppError('Email already exists', 409));
  }

  // Create new user with the given necessary data and save to DB
  const user = await User.create({
    fullName,
    email,
    password,
    avatar: {
      public_id: email,
      secure_url:
        'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
    },
  });

  // If user not created send message response
  if (!user) {
    return next(
      new AppError('User registration failed, please try again later', 400)
    );
  }

  // Run only if user sends a file
  if (req.file) {
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms', // Save files in a folder named lms
        width: 250,
        height: 250,
        gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
        crop: 'fill',
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in DB
        user.avatar.public_id = result.public_id;
        user.avatar.secure_url = result.secure_url;

        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      }
    } catch (error) {
      return next(
        new AppError(error || 'File not uploaded, please try again', 400)
      );
    }
  }

  // Save the user object
  await user.save();

  // Generating a JWT token
  const token = await user.generateJWTToken();

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Setting the token in the cookie with name token along with cookieOptions
  res.cookie('token', token, cookieOptions);

  // If all good send the response to the frontend
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
  });
};

export const loginUser = async (req, res, next) => {
  // Destructuring the necessary data from req object
  const { email, password } = req.body;

  // Check if the data is there or not, if not throw error message
  if (!email || !password) {
    return next(new AppError('Email and Password are required', 400));
  }

  // Finding the user with the sent email
  const user = await User.findOne({ email }).select('+password');

  // If no user or sent password do not match then send generic response
  if (!(user && (await user.comparePassword(password)))) {
    return next(
      new AppError('Email or Password do not match or user does not exist', 401)
    );
  }

  // Generating a JWT token
  const token = await user.generateJWTToken();

  // Setting the password to undefined so it does not get sent in the response
  user.password = undefined;

  // Setting the token in the cookie with name token along with cookieOptions
  res.cookie('token', token, cookieOptions);

  // If all good send the response to the frontend
  res.status(200).json({
    success: true,
    message: 'User logged in successfully',
    user,
  });
};

export const logout = (req, res) => {
  console.log("Logout function called");
  res.cookie('token', null, {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      httpOnly: true
  });
  res.status(200).json({
      success: true,
      message: 'User logged Out Successfully'
  });
};

export const  getProfile=async(req,res)=>{
  try {
    const userId=req.user.id
  const user=await User.findById(userId);
  res.status(200).json({
    success:true,
    message:'user details',
    user
  })
  } catch (error) {
    return next(new AppError('Failed to load details',500))
  }
  
} 



export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Email is required', 400));
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError('Email not registered', 400));
    }

    const resetToken = await user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Reset Password';
    const message = `
      You can reset your password by clicking <a href="${resetPasswordURL}" target="_blank">Reset your password</a>
      <br>If the above link does not work, copy and paste this link into a new tab: <br>
      ${resetPasswordURL}
      <br>If you have not requested this, please ignore.
    `;

    await SendEmail(email, subject, message);

    res.status(200).json({
      success: true,
      message: `Reset password link has been sent to ${email}`,
    });
  } catch (error) {
    user.forgotPasswordExpiry = undefined;
    user.forgotPasswordToken = undefined;
    await user.save();
    next(new AppError('Failed to send email. Please try again later.', 500));
  }
};



export const resetPassword = async (req, res, next) => {
  try {
    console.log('Params:', req.params); // Check if params are being received
    const { resetToken } = req.params;
    const { password } = req.body;

    console.log('resetToken:', resetToken); // Debug log
    console.log('password:', password); // Debug log

    if (!password) {
      return next(new AppError('Password is required', 400));
    }

    const forgotPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')

    const user = await User.findOne({
      forgotPasswordToken,
      forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or expired', 400));
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error during password reset:', error);
    next(new AppError('An error occurred while resetting password', 500));
  }
};






export const changePassword = async (req, res, next) => {
  try {
    // Destructuring the necessary data from the req object
    const { oldPassword, newPassword } = req.body;
    const { id } = req.user; // because of the middleware isLoggedIn

    // Check if the values are there or not
    if (!oldPassword || !newPassword) {
      return next(
        new AppError('Old password and new password are required', 400)
      );
    }

    // Finding the user by ID and selecting the password
    const user = await User.findById(id).select('+password');

    // If no user then throw an error message
    if (!user) {
      return next(new AppError('Invalid user id or user does not exist', 400));
    }

    // Check if the old password is correct
    const isPasswordValid = await user.comparePassword(oldPassword);

    // If the old password is not valid then throw an error message
    if (!isPasswordValid) {
      return next(new AppError('Invalid old password', 400));
    }

    // Setting the new password
    user.password = newPassword;

    // Save the data in DB
    await user.save();

    // Setting the password undefined so that it won't get sent in the response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { fullName } = req.body;
    const { id } = req.params;

    console.log(`Received update request for user ID: ${id}`);

    const user = await User.findById(id);

    if (!user) {
      console.error(`User not found with ID: ${id}`);
      return next(new AppError('Invalid user id or user does not exist', 404));
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (req.file) {
      console.log(`Uploading new avatar for user ID: ${id}`);
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);

      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms',
          width: 250,
          height: 250,
          gravity: 'faces',
          crop: 'fill',
        });

        if (result) {
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;

          await fs.rm(`uploads/${req.file.filename}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        return next(
          new AppError(error.message || 'File not uploaded, please try again', 400)
        );
      }
    }

    await user.save();

    console.log(`User details updated successfully for user ID: ${id}`);

    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    next(error);
  }
};


