import express from 'express';

import asyncHandler from '../../utils/async-handler';
import courseController from '../../controllers/course.controller';
import validateDto from '../../middlewares/validate';
import {
	CreateCourseDto,
	UpdateCourseDto,
} from '../../dtos/course.dto';
import {
	authenticate,
	authorize,
	optionalAuthenticate,
} from '../../middlewares/jwt.middleware';
import { Role } from '../../models/user.model';

const router = express.Router();

router.post(
	'/',
	validateDto(CreateCourseDto),
	authenticate,
	authorize(Role.ADMIN),
	asyncHandler(courseController.createCourse),
);
router.put(
	'/:id',
	validateDto(UpdateCourseDto),
	authenticate,
	authorize(Role.ADMIN),
	asyncHandler(courseController.updateCourse),
);
router.get('/courses', asyncHandler(courseController.getAllCourses));
router.get(
	'/courses/:id',
	optionalAuthenticate,
	asyncHandler(courseController.getCourseById),
);

// ============= Saved Course Routes =============
router.get(
	'/saved-courses',
	authenticate,
	asyncHandler(courseController.getSavedCourses),
);
router.get(
	'/saved-courses/:courseId/status',
	authenticate,
	asyncHandler(courseController.isCourseSaved),
);
router.post(
	'/saved-courses/:courseId',
	authenticate,
	asyncHandler(courseController.saveCourse),
);
router.delete(
	'/saved-courses/:courseId',
	authenticate,
	asyncHandler(courseController.unsaveCourse),
);

// ============= Enrollment Routes =============
router.get(
	'/enrollments',
	authenticate,
	asyncHandler(courseController.getEnrolledCourses),
);
router.get(
	'/enrollments/:courseId/status',
	authenticate,
	asyncHandler(courseController.isEnrolled),
);
router.post(
	'/enrollments/:courseId',
	authenticate,
	asyncHandler(courseController.enrollCourse),
);

router.post(
	'/recompute-embeddings',
	authenticate,
	authorize(Role.ADMIN),
	asyncHandler(courseController.recomputeEmbeddings),
);

export default router;
