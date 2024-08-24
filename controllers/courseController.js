import Course from '../models/courseModel.js';
import AppError from '../utils/errorutils.js';
import fs from 'fs/promises';
import cloudinary from 'cloudinary';

export const getAllCourses = async (req, res, next) => {
    try {
      // Find all the courses without lectures
      const courses = await Course.find({}).select('-lectures');
  
      res.status(200).json({
        success: true,
        message: 'All courses',
        courses,
      });
    } catch (error) {
      return next(new AppError(error.message,500))
    }
  };


  export const getLecturesByCourseId = async (req, res, next) => {
    const { id } = req.params;
  
    try {
      const course = await Course.findById(id);
  
      if (!course) {
        return next(new AppError('Invalid course id or course not found.', 404));
      }
  
      res.status(200).json({
        success: true,
        message: 'Course lectures fetched successfully',
        lectures: course.lectures,
      });
    } catch (error) {
      return next(new AppError(error.message,500))
    }
  };
  
 export const createCourse = async (req, res, next) => {
    const { title, description, category, createdBy } = req.body;
  
    if (!title || !description || !category || !createdBy) {
      return next(new AppError('All fields are required', 400));
    }
  
    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
    });
  
    if (!course) {
      return next(
        new AppError('Course could not be created, please try again', 400)
      );
    }
  
    // Run only if user sends a file
    if (req.file) {
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files in a folder named lms
        });
  
        // If success
        if (result) {
          // Set the public_id and secure_url in array
          course.thumbnail.public_id = result.public_id;
          course.thumbnail.secure_url = result.secure_url;
        }
  
        // After successful upload remove the file from local storage
        fs.rm(`uploads/${req.file.filename}`);
      } catch (error) {
        // Empty the uploads directory without deleting the uploads directory
        for (const file of await fs.readdir('uploads/')) {
          await fs.unlink(path.join('uploads/', file));
        }
  
        // Send the error message
        return next(
          new AppError(
            JSON.stringify(error) || 'File not uploaded, please try again',
            400
          )
        );
      }
    }
  
    // Save the changes
    await course.save();
  
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
  };
  
  export const updateCourseById = async (req, res, next) => {
    const { id } = req.params;
  
    try {
      const course = await Course.findByIdAndUpdate(
        id,
        {
          $set: req.body,
        },
        {
          runValidators: true,
        }
      );
  
      if (!course) {
        return next(new AppError('Invalid course id or course not found.', 400));
      }
  
      res.status(200).json({
        success: true,
        message: 'Course updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  export const addLectureToCourseById = async (req, res, next) => {
    const { title, description } = req.body;
    const { id } = req.params;
  
    let lectureData = {};
  
    if (!title || !description) {
      return next(new AppError('Title and Description are required', 400));
    }
  
    try {
      const course = await Course.findById(id);
  
      if (!course) {
        return next(new AppError('Invalid course id or course not found.', 400));
      }
  
      // Run only if user sends a file
      if (req.file) {
        try {
          const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'lms', // Save files in a folder named lms
            chunk_size: 50000000, // 50 MB size
            resource_type: 'video',
          });
  
          // If success
          if (result) {
            // Set the public_id and secure_url in the lectureData object
            lectureData.public_id = result.public_id;
            lectureData.secure_url = result.secure_url;
          }
  
          // After successful upload, remove the file from local storage
          await fs.rm(`uploads/${req.file.filename}`);
        } catch (error) {
          // Empty the uploads directory without deleting the directory itself
          const files = await fs.readdir('uploads/');
          for (const file of files) {
            await fs.unlink(path.join('uploads/', file));
          }
  
          // Send the error message
          return next(
            new AppError(
              JSON.stringify(error) || 'File not uploaded, please try again',
              400
            )
          );
        }
      }
  
      course.lectures.push({
        title,
        description,
        lecture: lectureData,
      });
  
      course.numberOfLectures = course.lectures.length;
  
      // Save the course object
      await course.save();
  
      res.status(200).json({
        success: true,
        message: 'Course lecture added successfully',
        course,
      });
    } catch (error) {
      next(error);
    }
  };  


  export const removeLectureFromCourse = async (req, res, next) => {
    const { courseId, lectureId } = req.query;
  
    console.log(courseId);
  
    if (!courseId) {
      return next(new AppError('Course ID is required', 400));
    }
  
    if (!lectureId) {
      return next(new AppError('Lecture ID is required', 400));
    }
  
    try {
      const course = await Course.findById(courseId);
  
      if (!course) {
        return next(new AppError('Invalid ID or Course does not exist.', 404));
      }
  
      const lectureIndex = course.lectures.findIndex(
        (lecture) => lecture._id.toString() === lectureId.toString()
      );
  
      if (lectureIndex === -1) {
        return next(new AppError('Lecture does not exist.', 404));
      }
  
      // Delete the lecture from Cloudinary
      await cloudinary.v2.uploader.destroy(
        course.lectures[lectureIndex].lecture.public_id,
        {
          resource_type: 'video',
        }
      );
  
      // Remove the lecture from the array
      course.lectures.splice(lectureIndex, 1);
  
      // Update the number of lectures
      course.numberOfLectures = course.lectures.length;
  
      // Save the updated course
      await course.save();
  
      res.status(200).json({
        success: true,
        message: 'Course lecture removed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  export const deleteCourseById = async (req, res, next) => {
    const { id } = req.params;
  
    try {
      const course = await Course.findById(id);
  
      if (!course) {
        return next(new AppError('Course with given id does not exist.', 404));
      }
  
      // Remove the course using deleteOne
      await Course.deleteOne({ _id: id });
  
      res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };