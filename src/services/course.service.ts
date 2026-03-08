import CourseModel, { type ICourse } from '../models/course.model';
import CourseViewModel from '../models/course-view.model';
import { CreateCourseDto } from '../dtos/course.dto';
import { NotFoundError } from '../core/error.response';
import SavedCourseModel from '../models/saved-course.model';
import EnrollmentModel from '../models/enrollment.model';
import EmbeddingUtil from '../utils/embedding.util';

export class CourseService {
	private static readonly EMBEDDING_BATCH_SIZE = 5;
	private static readonly EMBEDDING_BATCH_DELAY_MS = 500;
	private static readonly EMBEDDING_FIELDS = [
		'title',
		'summary',
		'brief_summary',
		'tags',
		'target_audience',
		'learner_tags',
	] as const;

	/**
	 * Generate embedding for a course and update it in the database
	 * @param course - The course document to generate embedding for
	 * @returns The updated course with embedding, or original course if embedding fails
	 */
	private static async generateAndSaveEmbedding(
		course: ICourse,
	): Promise<ICourse> {
		if (!EmbeddingUtil.isConfigured()) {
			console.warn(
				`[CourseService] Embedding not generated for course ${course._id}: GEMINI_API_KEY not configured`,
			);
			return course;
		}

		try {
			const textToEmbed = EmbeddingUtil.createCourseEmbeddingText({
				title: course.title,
				summary: course.summary,
				brief_summary: course.brief_summary,
				tags: course.tags,
				target_audience: course.target_audience,
				learner_tags: course.learner_tags,
			});

			const embedding =
				await EmbeddingUtil.generateEmbedding(textToEmbed);

			const updatedCourse = await CourseModel.findByIdAndUpdate(
				course._id,
				{ $set: { embedding } },
				{ new: true },
			);

			console.log(
				`[CourseService] Embedding generated for course ${course._id}: ${course.title}`,
			);

			return updatedCourse || course;
		} catch (error) {
			console.error(
				`[CourseService] Failed to generate embedding for course ${course._id}:`,
				error,
			);
			return course;
		}
	}

	static async createCourse(data: CreateCourseDto) {
		const course = await CourseModel.create(data);

		const courseWithEmbedding =
			await this.generateAndSaveEmbedding(course);

		return courseWithEmbedding;
	}

	/**
	 * Check if any embedding-related fields have changed
	 */
	private static hasEmbeddingFieldsChanged(
		data: Partial<ICourse>,
	): boolean {
		return this.EMBEDDING_FIELDS.some(
			(field) => data[field] !== undefined,
		);
	}

	static async updateCourse(id: string, data: Partial<ICourse>) {
		const course = await CourseModel.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		});
		if (!course) {
			throw new NotFoundError('Course not found !');
		}

		if (this.hasEmbeddingFieldsChanged(data)) {
			return await this.generateAndSaveEmbedding(course);
		}

		return course;
	}

	static async getCourseById(id: string) {
		return CourseModel.findById(id).lean();
	}

	static async getAllCourses({
		limit = 50,
		skip = 0,
		search,
		skillLevel,
	}: {
		limit?: number;
		skip?: number;
		search?: string;
		skillLevel?: string;
	} = {}) {
		let query: Record<string, any> = {};

		if (search && search.trim()) {
			query.$text = { $search: search.trim() };
		}

		if (skillLevel && skillLevel !== 'all') {
			query.$and = query.$and || [];

			const skillLevelFilter = {
				$and: [
					{
						$or: [
							{ target_audience: skillLevel },
							{
								$and: [
									{
										$or: [
											{ target_audience: { $exists: false } },
											{ target_audience: { $eq: null } },
											{ target_audience: { $eq: '' } },
										],
									},
									...(skillLevel === 'beginner'
										? [
												{
													learner_tags: {
														$in: ['become-a-developer'],
													},
												},
											]
										: []),
									...(skillLevel === 'intermediate'
										? [
												{
													learner_tags: { $in: ['grow-my-skillset'] },
												},
											]
										: []),
									...(skillLevel === 'advanced'
										? [
												{
													learner_tags: {
														$in: ['prepare-for-interview'],
													},
												},
											]
										: []),
								],
							},
						],
					},
					{
						$nor: [
							...(skillLevel === 'beginner'
								? [
										{
											$and: [
												{ target_audience: 'beginner' },
												{
													learner_tags: {
														$in: [
															'grow-my-skillset',
															'prepare-for-interview',
														],
													},
												},
											],
										},
									]
								: []),
							...(skillLevel === 'intermediate'
								? [
										{
											$and: [
												{ target_audience: 'intermediate' },
												{
													learner_tags: {
														$in: [
															'become-a-developer',
															'prepare-for-interview',
														],
													},
												},
											],
										},
									]
								: []),
							...(skillLevel === 'advanced'
								? [
										{
											$and: [
												{ target_audience: 'advanced' },
												{
													learner_tags: {
														$in: [
															'become-a-developer',
															'grow-my-skillset',
														],
													},
												},
											],
										},
									]
								: []),
						],
					},
				],
			};

			query.$and.push(skillLevelFilter);
		}

		let sortCriteria: Record<string, any> = { createdAt: -1 };
		if (search && search.trim()) {
			sortCriteria = { score: { $meta: 'textScore' }, createdAt: -1 };
		}

		const [courses, total] = await Promise.all([
			CourseModel.find(query)
				.skip(skip)
				.limit(limit)
				.lean()
				.sort(sortCriteria),
			CourseModel.countDocuments(query),
		]);

		return {
			courses,
			total,
		};
	}

	static async incrementCourseViews(
		id: string,
		userId?: string,
		ipAddress?: string,
	) {
		if (!userId && !ipAddress) {
			return;
		}

		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

		const query: any = {
			course_id: id,
			viewedAt: { $gte: fiveMinutesAgo },
		};

		if (userId) {
			query.user_id = userId;
		} else {
			query.ip_address = ipAddress;
		}

		const existingView = await CourseViewModel.findOne(query);

		if (existingView) {
			return;
		}

		await CourseViewModel.create({
			course_id: id,
			user_id: userId,
			ip_address: ipAddress,
		});

		return CourseModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
	}

	// @TODO: optimize save course
	static async saveCourse(userId: string, courseId: string) {
		const existing = await SavedCourseModel.findOne({
			user_id: userId,
			course_id: courseId,
		});

		if (existing) {
			return { saved: true, message: 'Course already saved' };
		}

		await SavedCourseModel.create({
			user_id: userId,
			course_id: courseId,
		});

		return { saved: true, message: 'Course saved successfully' };
	}

	static async unsaveCourse(userId: string, courseId: string) {
		const result = await SavedCourseModel.findOneAndDelete({
			user_id: userId,
			course_id: courseId,
		});

		if (!result) {
			return { saved: false, message: 'Course was not saved' };
		}

		return { saved: false, message: 'Course removed from saved' };
	}

	static async isCourseSaved(
		userId: string,
		courseId: string,
	): Promise<boolean> {
		const saved = await SavedCourseModel.findOne({
			user_id: userId,
			course_id: courseId,
		});

		return !!saved;
	}

	static async getSavedCourses(
		userId: string,
		{ limit = 50, skip = 0 }: { limit?: number; skip?: number } = {},
	) {
		const [savedCourses, total] = await Promise.all([
			SavedCourseModel.find({ user_id: userId })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate('course_id')
				.lean(),
			SavedCourseModel.countDocuments({ user_id: userId }),
		]);

		const courses = savedCourses.map((sc: any) => sc.course_id);

		return { courses, total };
	}

	static async enrollCourse(userId: string, courseId: string) {
		const existing = await EnrollmentModel.findOne({
			user_id: userId,
			course_id: courseId,
		});

		if (existing) {
			await EnrollmentModel.updateOne(
				{ _id: existing._id },
				{ lastAccessedAt: new Date() },
			);
			return {
				enrolled: true,
				isNew: false,
				message: 'Already enrolled in this course',
				enrollment: existing,
			};
		}

		const enrollment = await EnrollmentModel.create({
			user_id: userId,
			course_id: courseId,
		});

		return {
			enrolled: true,
			isNew: true,
			message: 'Successfully enrolled in course',
			enrollment,
		};
	}

	static async isEnrolled(userId: string, courseId: string) {
		const enrollment = await EnrollmentModel.findOne({
			user_id: userId,
			course_id: courseId,
		});

		return {
			enrolled: !!enrollment,
			enrollment: enrollment || null,
		};
	}

	static async getEnrolledCourses(
		userId: string,
		{ limit = 50, skip = 0 }: { limit?: number; skip?: number } = {},
	) {
		const [enrollments, total] = await Promise.all([
			EnrollmentModel.find({ user_id: userId })
				.sort({ lastAccessedAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate('course_id')
				.lean(),
			EnrollmentModel.countDocuments({ user_id: userId }),
		]);

		const courses = enrollments.map((e: any) => ({
			...e.course_id,
			progress: e.progress,
			completed: e.completed,
			enrolledAt: e.enrolledAt,
			lastAccessedAt: e.lastAccessedAt,
		}));

		return { courses, total };
	}

	/**
	 * Recompute embeddings for courses
	 * @param options.force - If true, regenerate all embeddings. Default: false
	 * @param options.courseId - If provided, only recompute for this specific course
	 * @returns Statistics about the recomputation
	 */
	static async recomputeEmbeddings(
		options: {
			force?: boolean;
			courseId?: string;
		} = {},
	): Promise<{
		processed: number;
		successful: number;
		failed: number;
		errors: { courseId: string; title: string; error: string }[];
	}> {
		const { force = false, courseId } = options;

		if (!EmbeddingUtil.isConfigured()) {
			throw new Error(
				'Embedding service is not configured. Please set GEMINI_API_KEY.',
			);
		}

		let courses: ICourse[];

		if (courseId) {
			const course = await CourseModel.findById(courseId);
			if (!course) {
				throw new NotFoundError(`Course not found: ${courseId}`);
			}
			courses = [course];
		} else if (force) {
			courses = await CourseModel.find({});
		} else {
			courses = await CourseModel.find({
				$or: [
					{ embedding: null },
					{ embedding: { $exists: false } },
					{ embedding: { $size: 0 } },
				],
			});
		}

		const totalCourses = courses.length;

		if (totalCourses === 0) {
			return {
				processed: 0,
				successful: 0,
				failed: 0,
				errors: [],
			};
		}

		console.log(
			`[CourseService] Starting embedding recomputation for ${totalCourses} courses (force=${force})`,
		);

		let processed = 0;
		let successful = 0;
		let failed = 0;
		const errors: {
			courseId: string;
			title: string;
			error: string;
		}[] = [];

		for (
			let i = 0;
			i < courses.length;
			i += this.EMBEDDING_BATCH_SIZE
		) {
			const batch = courses.slice(i, i + this.EMBEDDING_BATCH_SIZE);

			const batchPromises = batch.map(async (course) => {
				try {
					const textToEmbed = EmbeddingUtil.createCourseEmbeddingText(
						{
							title: course.title,
							summary: course.summary,
							brief_summary: course.brief_summary,
							tags: course.tags,
							target_audience: course.target_audience,
							learner_tags: course.learner_tags,
						},
					);

					const embedding =
						await EmbeddingUtil.generateEmbedding(textToEmbed);

					await CourseModel.updateOne(
						{ _id: course._id },
						{ $set: { embedding } },
					);

					successful++;
					return { success: true };
				} catch (error) {
					failed++;
					const errorMsg =
						error instanceof Error ? error.message : String(error);
					errors.push({
						courseId: course._id.toString(),
						title: course.title,
						error: errorMsg,
					});
					return { success: false };
				}
			});

			await Promise.all(batchPromises);
			processed += batch.length;

			const percentage = ((processed / totalCourses) * 100).toFixed(
				1,
			);
			console.log(
				`[CourseService] Embedding progress: ${processed}/${totalCourses} (${percentage}%) - ${successful} successful, ${failed} failed`,
			);

			if (i + this.EMBEDDING_BATCH_SIZE < courses.length) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.EMBEDDING_BATCH_DELAY_MS),
				);
			}
		}

		console.log(
			`[CourseService] Embedding recomputation complete: ${successful} successful, ${failed} failed`,
		);

		return {
			processed,
			successful,
			failed,
			errors,
		};
	}
}

export default CourseService;
