import dotenv from 'dotenv';

import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import router from './routers';

const app = express();
dotenv.config();

// init middleware
app.use(
	morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'),
);
app.use(helmet());
app.use(
	compression({
		filter: (req, res) => {
			if (
				req.path.includes('/chat/stream') ||
				req.headers.accept?.includes('text/event-stream')
			) {
				return false;
			}
			return compression.filter(req, res);
		},
	}),
);
app.use(cookieParser());
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	}),
);

app.use(
	cors({
		origin: process.env.CLIENT_URL || 'http://localhost:5173',
		credentials: true,
	}),
);

// init db
import './db/init.mongodb';

// init routers
app.use('/', router);

app.use((req, res, next) => {
	const error = new Error('Not found');
	// @ts-ignore
	error.status = 404;
	next(error);
});

app.use((error: any, req: any, res: any, next: any) => {
	const statusCode = error.status || 500;
	const errorResponse: Record<string, unknown> = {
		status: 'error',
		code: statusCode,
		message: error.message,
	};

	if (process.env.NODE_ENV !== 'production') {
		errorResponse.stack = error.stack;
	}

	return res.status(statusCode).json(errorResponse);
});

export default app;
