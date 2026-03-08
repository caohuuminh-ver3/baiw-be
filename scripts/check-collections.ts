import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkCollections = async () => {
	try {
		const mongoUri = process.env.MONGO_URI;
		if (!mongoUri) {
			console.error('MONGO_URI is not defined');
			process.exit(1);
		}

		await mongoose.connect(mongoUri);
		console.log('Connected.');

		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		console.log('Collections:');
		for (const col of collections) {
			const count = await mongoose.connection.db
				.collection(col.name)
				.countDocuments();
			console.log(` - ${col.name}: ${count}`);
		}

		await mongoose.disconnect();
		process.exit(0);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}
};

checkCollections();
