import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

class DBConnect {
	static instance: DBConnect;

	constructor() {
		this.connect();
	}

	static getInstance() {
		if (!DBConnect.instance) {
			DBConnect.instance = new DBConnect();
		}
		return DBConnect.instance;
	}

	connect(type = 'mongodb') {
		if (process.env.NODE_ENV === 'development') {
			mongoose.set('debug', true);
			mongoose.set('debug', { color: true });
		}

		mongoose
			.connect(MONGO_URI!, {
				maxPoolSize: 100,
			})
			.then(() => {
				console.log('Connected Mongodb success!');
			})
			.catch((err) =>
				console.log('Error connecting database: ' + err)
			);

		mongoose.connection.on('connected', () => {
			console.info('Connected to MongoDB!');
		});

		mongoose.connection.on('reconnected', () => {
			console.info('MongoDB reconnected!');
		});

		mongoose.connection.on('error', (error) => {
			console.error(`Error in MongoDb connection: ${error}`);
			mongoose.disconnect();
		});

		mongoose.connection.on('disconnected', () => {
			console.error(
				`MongoDB disconnected! Reconnecting in ${10000 / 1000}s...`
			);
			setTimeout(() => this.connect(), 10000);
		});
	}
}

const instanceMongoDb = DBConnect.getInstance();
export default instanceMongoDb;
