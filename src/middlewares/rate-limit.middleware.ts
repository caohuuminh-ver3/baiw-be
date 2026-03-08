import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from '../core/http/statusCodes';
import { ReasonPhrases } from '../core/http/reasonPhrases';

interface RateLimitOptions {
	/** Time window in milliseconds */
	windowMs: number;
	/** Maximum number of requests per window */
	max: number;
	/** Custom message for rate limit exceeded */
	message?: string;
	/** Key generator function - defaults to IP address */
	keyGenerator?: (req: Request) => string;
}

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

/**
 * Simple in-memory rate limiter middleware
 * For production, consider using Redis-based rate limiting
 */
export function createRateLimiter(options: RateLimitOptions) {
	const {
		windowMs,
		max,
		message = 'You have sent too many messages. Please wait a minute and try again.',
		keyGenerator = (req: Request) =>
			(req.ip ||
				req.headers['x-forwarded-for']?.toString() ||
				'unknown') as string,
	} = options;

	const store = new Map<string, RateLimitEntry>();

	setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store.entries()) {
			if (entry.resetTime <= now) {
				store.delete(key);
			}
		}
	}, windowMs);

	return (req: Request, res: Response, next: NextFunction) => {
		const key = keyGenerator(req);
		const now = Date.now();

		let entry = store.get(key);

		if (!entry || entry.resetTime <= now) {
			entry = {
				count: 1,
				resetTime: now + windowMs,
			};
			store.set(key, entry);
		} else {
			entry.count++;
		}

		const remaining = Math.max(0, max - entry.count);
		const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

		res.setHeader('X-RateLimit-Limit', max);
		res.setHeader('X-RateLimit-Remaining', remaining);
		res.setHeader('X-RateLimit-Reset', resetSeconds);

		if (entry.count > max) {
			res.setHeader('Retry-After', resetSeconds);
			return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
				status: 'error',
				statusCode: StatusCodes.TOO_MANY_REQUESTS,
				message: ReasonPhrases.TOO_MANY_REQUESTS,
				error: message,
			});
		}

		next();
	};
}

/**
 * Pre-configured rate limiter for chat endpoints
 * Allows 20 requests per minute per IP
 */
export const chatRateLimiter = createRateLimiter({
	windowMs: 60 * 1000, // 1 minute
	max: 20,
	message:
		'You have sent too many messages. Please wait a minute and try again.',
});

/**
 * Stricter rate limiter for AI-intensive operations
 * Allows 10 requests per minute per IP
 */
export const aiRateLimiter = createRateLimiter({
	windowMs: 60 * 1000,
	max: 10,
	message:
		'You have sent too many AI requests. Please wait a minute and try again.',
});
