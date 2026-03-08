import { NextFunction, Request, Response } from 'express';
import { CREATED, OK } from '../core/success.response';
import CourseService from '../services/course.service';
import {
	getPagination,
	getPaginationMetadata,
} from '../utils/pagination.util';

class CourseController {
	createCourse = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		return new CREATED({
			message: 'Create course successful !',
			data: await CourseService.createCourse(req.body),
		}).send(res);
	};

	updateCourse = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const course = await CourseService.updateCourse(
			req.params.id,
			req.body,
		);

		return new OK({
			message: 'Update course successful !',
			data: course,
		}).send(res, next);
	};

	getCourseById = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { id } = req.params;
		const course = await CourseService.getCourseById(id);

		if (!course) {
			return res.status(404).json({ message: 'Course not found' });
		}

		const user = (req as any).user;
		const userId = user?.userId;

		if (userId) {
			const ipAddress = req.ip || req.socket.remoteAddress;
			CourseService.incrementCourseViews(id, userId, ipAddress).catch(
				(err) => console.error('Failed to increment views', err),
			);
		}

		return new OK({
			message: 'Get course successful !',
			data: course,
		}).send(res, next);
	};

	getAllCourses = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { page, limit, skip } = getPagination(req.query);
		const { search, skillLevel } = req.query as any;

		const { courses, total } = await CourseService.getAllCourses({
			limit,
			skip,
			search,
			skillLevel,
		});

		return new OK({
			message: 'Get all courses successful !',
			data: courses,
			meta: {
				...getPaginationMetadata(total, page, limit),
			},
		}).send(res, next);
	};

	// ============= Saved Course Handlers =============

	saveCourse = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { courseId } = req.params;

		const result = await CourseService.saveCourse(userId, courseId);

		return new CREATED({
			message: result.message,
			data: { saved: result.saved },
		}).send(res);
	};

	unsaveCourse = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { courseId } = req.params;

		const result = await CourseService.unsaveCourse(userId, courseId);

		return new OK({
			message: result.message,
			data: { saved: result.saved },
		}).send(res, next);
	};

	isCourseSaved = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { courseId } = req.params;

		const saved = await CourseService.isCourseSaved(userId, courseId);

		return new OK({
			message: 'Check saved status successful',
			data: { saved },
		}).send(res, next);
	};

	getSavedCourses = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { page, limit, skip } = getPagination(req.query);

		const { courses, total } = await CourseService.getSavedCourses(
			userId,
			{
				limit,
				skip,
			},
		);

		return new OK({
			message: 'Get saved courses successful',
			data: courses,
			meta: {
				...getPaginationMetadata(total, page, limit),
			},
		}).send(res, next);
	};

	// ============= Enrollment Handlers =============

	enrollCourse = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { courseId } = req.params;

		const result = await CourseService.enrollCourse(userId, courseId);

		return new CREATED({
			message: result.message,
			data: {
				enrolled: result.enrolled,
				isNew: result.isNew,
				enrollment: result.enrollment,
			},
		}).send(res);
	};

	isEnrolled = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { courseId } = req.params;

		const result = await CourseService.isEnrolled(userId, courseId);

		return new OK({
			message: 'Check enrollment status successful',
			data: result,
		}).send(res, next);
	};

	getEnrolledCourses = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { page, limit, skip } = getPagination(req.query);

		const { courses, total } = await CourseService.getEnrolledCourses(
			userId,
			{
				limit,
				skip,
			},
		);

		return new OK({
			message: 'Get enrolled courses successful',
			data: courses,
			meta: {
				...getPaginationMetadata(total, page, limit),
			},
		}).send(res, next);
	};

	recomputeEmbeddings = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { force, courseId } = req.query;

		const result = await CourseService.recomputeEmbeddings({
			force: force === 'true',
			courseId: courseId as string | undefined,
		});

		return new OK({
			message: `Embedding recomputation complete: ${result.successful} successful, ${result.failed} failed`,
			data: result,
		}).send(res, next);
	};
}

const courseController = new CourseController();

export default courseController;
