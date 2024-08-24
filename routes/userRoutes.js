import { Router } from "express";
import { isLoggedIn } from "../middleware/authmiddleware.js";
import { changePassword, forgotPassword, getProfile, loginUser, logout, register, resetPassword, updateUser } from "../controllers/userController.js";
import upload from "../middleware/multermiddleware.js";



const router =Router()

router.post('/register',upload.single('avatar'),register);

router.post('/login',loginUser);

router.post('/logout', logout);

router.get('/me',isLoggedIn,getProfile);

router.post('/reset',forgotPassword);
router.post('/reset-password/:resetToken', (req, res, next) => {
    console.log('Reset Password Route Hit');
    resetPassword(req, res, next);
  });
router.post('/changePassword',isLoggedIn,changePassword)

router.put('/update/:id', isLoggedIn,upload.single('avatar') ,updateUser);
export default router;