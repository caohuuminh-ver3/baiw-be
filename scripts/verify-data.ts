import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

import UserModel from '../src/models/user.model';
import EnrollmentModel from '../src/models/enrollment.model';
import SavedCourseModel from '../src/models/saved-course.model';
import CourseViewModel from '../src/models/course-view.model';

const verifyData = async () => {
	try {
		const mongoUri = process.env.MONGO_URI;
		if (!mongoUri) {
			console.error('MONGO_URI is not defined in .env');
			process.exit(1);
		}

		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 5000,
		});

		const userCount = await UserModel.countDocuments({
			username: { $regex: /^fake_user_/ },
		});
		const enrollmentCount = await EnrollmentModel.countDocuments();
		const savedCourseCount = await SavedCourseModel.countDocuments();
		const courseViewCount = await CourseViewModel.countDocuments();

		console.log('--- Database Verification ---');
		console.log(`Fake Users: ${userCount}`);
		console.log(`Total Enrollments: ${enrollmentCount}`);
		console.log(`Total Saved Courses: ${savedCourseCount}`);
		console.log(`Total Course Views: ${courseViewCount}`);

		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error('Verification failed:', error);
		process.exit(1);
	}
};

verifyData();
