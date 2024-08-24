import { Router } from "express";
import { authorizeRoles, isLoggedIn } from "../middleware/authmiddleware.js";
import { contactUs, userStats } from "../controllers/miscControllers.js";





const router = Router();

// {{URL}}/api/v1/
router.route('/contact').post(contactUs);
router
  .route('/admin/stats/users')
  .get(isLoggedIn, authorizeRoles('ADMIN'), userStats);

export default router;