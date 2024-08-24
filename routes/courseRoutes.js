import { Router } from "express";
import { addLectureToCourseById, createCourse, deleteCourseById, getAllCourses, getLecturesByCourseId, removeLectureFromCourse, updateCourseById } from "../controllers/courseController.js";
import { authorizeRoles, authorizeSubscribers, isLoggedIn } from "../middleware/authmiddleware.js";
import upload from "../middleware/multermiddleware.js";

const router = Router();

router
  .route('/')
  .get(getAllCourses)
  .post(
    isLoggedIn,
    authorizeRoles('ADMIN'),
    upload.single('thumbnail'),
    createCourse
  );

router
  .route('/:id')
  .get(isLoggedIn, authorizeSubscribers, getLecturesByCourseId)
  .post(
    isLoggedIn,
    authorizeRoles('ADMIN'),
    upload.single('lecture'),
    addLectureToCourseById
  )
  .delete(isLoggedIn, authorizeRoles('ADMIN'), deleteCourseById)
  .put(isLoggedIn, authorizeRoles('ADMIN'), updateCourseById);

router
  .route('/lecture')
  .delete(isLoggedIn, authorizeRoles('ADMIN'), removeLectureFromCourse);

export default router;
