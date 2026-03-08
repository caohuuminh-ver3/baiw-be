import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import CourseModel from '../src/models/course.model';
import UserModel from '../src/models/user.model';
import CourseViewModel from '../src/models/course-view.model';

const randomInt = (min: number, max: number) =>
	Math.floor(Math.random() * (max - min + 1)) + min;
const randomSubset = <T>(array: T[], count: number): T[] => {
	const shuffled = array.slice().sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
};

const seedRecentViews = async () => {
	try {
		console.log('Starting seed recent course views...');
		const mongoUri = process.env.MONGO_URI;
		if (!mongoUri) {
			console.error('MONGO_URI is not defined');
			process.exit(1);
		}

		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});
		console.log('Connected.');

		// Get all fake users
		const users = await UserModel.find(
			{ username: { $regex: /^fake_user_/ } },
			'_id',
		).lean();
		const userIds = users.map((u: any) => u._id);
		const totalUsers = userIds.length;
		console.log(`Found ${totalUsers} fake users.`);

		const courses = await CourseModel.find({}, '_id').lean();
		const courseIds = courses.map((c: any) => c._id);
		const totalCourses = courseIds.length;
		console.log(`Found ${totalCourses} courses.`);

		if (totalUsers === 0 || totalCourses === 0) {
			console.log('Not enough data to seed views.');
			process.exit(0);
		}

		const courseViewsToInsert = [];
		const maxInteractions = Math.min(totalCourses, 1000);
		const minInteractions = Math.min(totalCourses, 500);

		console.log('Generating views...');
		for (const userId of userIds) {
			const numViews = randomInt(minInteractions, maxInteractions);
			const viewedCourseIds = randomSubset(courseIds, numViews);

			for (const courseId of viewedCourseIds) {
				courseViewsToInsert.push({
					user_id: userId,
					course_id: courseId,
					viewedAt: new Date(Date.now() - randomInt(0, 86000000)), // within last 24h (~86.4M ms)
					ip_address: `192.168.${randomInt(0, 255)}.${randomInt(0, 255)}`,
				});
			}
		}

		console.log(
			`Inserting ${courseViewsToInsert.length} recent course views...`,
		);
		const chunkSize = 2000;
		for (let i = 0; i < courseViewsToInsert.length; i += chunkSize) {
			const chunk = courseViewsToInsert.slice(i, i + chunkSize);
			await CourseViewModel.insertMany(chunk, { ordered: false });
			if (i > 0 && i % 50000 === 0)
				console.log(
					`  Inserted ${i}/${courseViewsToInsert.length}...`,
				);
		}

		console.log('Done.');
		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
};

seedRecentViews();
