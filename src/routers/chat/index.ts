import express from 'express';

import asyncHandler from '../../utils/async-handler';
import chatbotController from '../../controllers/chatbot.controller';
import validate from '../../middlewares/validate';
import { SendMessageDto } from '../../dtos/chatbot.dto';
import {
	authenticate,
	optionalAuthenticate,
} from '../../middlewares/jwt.middleware';
import { chatRateLimiter } from '../../middlewares/rate-limit.middleware';

const router = express.Router();

router.post(
	'/chat',
	chatRateLimiter,
	optionalAuthenticate,
	validate(SendMessageDto),
	asyncHandler(chatbotController.chat),
);

router.get(
	'/chat/stream',
	chatRateLimiter,
	optionalAuthenticate,
	chatbotController.chatStream,
);

router.get(
	'/chat/sessions',
	authenticate,
	asyncHandler(chatbotController.getSessions),
);

router.get(
	'/chat/:sessionId',
	optionalAuthenticate,
	asyncHandler(chatbotController.getHistory),
);

export default router;
