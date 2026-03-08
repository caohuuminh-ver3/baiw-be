import { NextFunction, Response } from 'express';

import { OK } from '../core/success.response';
import { NotFoundError } from '../core/error.response';
import ChatbotService from '../services/chatbot.service';
import {
	getPagination,
	getPaginationMetadata,
} from '../utils/pagination.util';
import { RequestWithUser } from '../middlewares/jwt.middleware';

class ChatbotController {
	chat = async (
		req: RequestWithUser,
		res: Response,
		next: NextFunction,
	) => {
		const userId = req.user?.userId;

		const result = await ChatbotService.chat(req.body, userId);

		const data = {
			...result,
			message: {
				...result.message,
				referenced_courses: result.message.referenced_products,
			},
		};

		return new OK({
			message: 'Message sent successfully',
			data,
		}).send(res, next);
	};

	chatStream = async (req: RequestWithUser, res: Response) => {
		const userId = req.user?.userId;
		const { message, session_id, course_id } = req.query;

		if (!message || typeof message !== 'string') {
			res.status(400).json({ error: 'Message is required' });
			return;
		}

		res.setHeader('Content-Type', 'text/event-stream');
		res.setHeader('Cache-Control', 'no-cache');
		res.setHeader('Connection', 'keep-alive');
		res.setHeader('X-Accel-Buffering', 'no');
		res.flushHeaders();

		const dto = {
			message,
			session_id: session_id as string | undefined,
			course_id: course_id as string | undefined,
		};

		try {
			const stream = ChatbotService.chatStream(dto, userId);

			for await (const event of stream) {
				if (event.type === 'token') {
					res.write(
						`data: ${JSON.stringify({ token: event.content })}\n\n`,
					);
					if (typeof res.flush === 'function') {
						res.flush();
					}
				} else if (event.type === 'metadata') {
					res.write(
						`data: ${JSON.stringify({
							done: true,
							session_id: event.session_id,
							referenced_courses: event.referenced_products,
						})}\n\n`,
					);
					if (typeof res.flush === 'function') {
						res.flush();
					}
				} else if (event.type === 'error') {
					res.write(
						`data: ${JSON.stringify({ error: event.content })}\n\n`,
					);
					if (typeof res.flush === 'function') {
						res.flush();
					}
				}
			}
		} catch (error) {
			console.error('Stream error:', error);
			res.write(
				`data: ${JSON.stringify({ error: 'An error occurred' })}\n\n`,
			);
		}

		res.write('data: [DONE]\n\n');
		res.end();
	};

	getHistory = async (
		req: RequestWithUser,
		res: Response,
		next: NextFunction,
	) => {
		const { sessionId } = req.params;
		const userId = req.user?.userId;

		const result = await ChatbotService.getHistory(sessionId, userId);

		if (!result) {
			throw new NotFoundError('Chat session not found');
		}

		return new OK({
			message: 'Get chat history successful',
			data: result,
		}).send(res, next);
	};

	getSessions = async (
		req: RequestWithUser,
		res: Response,
		next: NextFunction,
	) => {
		const userId = req.user?.userId;
		const { page, limit, skip } = getPagination(req.query);

		const { sessions, total } = await ChatbotService.getUserSessions(
			userId!,
			{ limit, skip },
		);

		return new OK({
			message: 'Get chat sessions successful',
			data: sessions,
			meta: {
				...getPaginationMetadata(total, page, limit),
			},
		}).send(res, next);
	};
}

const chatbotController = new ChatbotController();

export default chatbotController;
