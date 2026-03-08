import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../models/user.model';
import KeyTokenModel from '../models/keytoken.model';
import { verifyJWT } from '../utils/auth/auth-util';

/**
 * JWT payload structure from authentication
 */
export interface JWTPayload {
	userId: string;
	email: string;
	roles: Role[];
	iat?: number;
	exp?: number;
}

/**
 * Express Request with authenticated user information
 */
export interface RequestWithUser
	extends Request<Record<string, any>, any, any, any, any> {
	user?: JWTPayload;
	body: any;
	params: any;
	query: any;
}

export async function authenticate(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const auth = req.headers.authorization;
	if (!auth || !auth.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Unauthenticate' });
	}
	const token = auth.split(' ')[1];

	try {
		const decoded = jwt.decode(token) as JWTPayload | null;
		if (!decoded || !decoded.userId) {
			return res
				.status(401)
				.json({ message: 'Invalid token format' });
		}

		const keyToken = await KeyTokenModel.findOne({
			userId: decoded.userId,
		});
		if (!keyToken) {
			return res
				.status(401)
				.json({ message: 'Token not found or expired' });
		}

		const payload = (await verifyJWT({
			token,
			keySecret: keyToken.publicKey,
		})) as JWTPayload;

		(req as RequestWithUser).user = payload;
		return next();
	} catch (err) {
		return res
			.status(401)
			.json({ message: 'Invalid or expired token' });
	}
}

/**
 * Optional authentication middleware.
 * Extracts user info if valid token is present, but allows request to proceed without auth.
 */
export async function optionalAuthenticate(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const auth = req.headers.authorization;
	if (!auth || !auth.startsWith('Bearer ')) {
		return next();
	}

	const token = auth.split(' ')[1];
	try {
		const decoded = jwt.decode(token) as JWTPayload | null;
		if (!decoded || !decoded.userId) {
			return next();
		}

		const keyToken = await KeyTokenModel.findOne({
			userId: decoded.userId,
		});
		if (!keyToken) {
			return next();
		}

		const payload = (await verifyJWT({
			token,
			keySecret: keyToken.publicKey,
		})) as JWTPayload;

		(req as RequestWithUser).user = payload;
	} catch (err) {
		return next();
	}

	return next();
}

export const authorize = (...roles: Role[]) => {
	return (
		req: RequestWithUser,
		res: Response,
		next: NextFunction,
	) => {
		if (!req.user) {
			return res.status(401).send('Unauthorized');
		}

		const userRoles = req.user.roles;
		const isMatchRole = roles.some((role) =>
			userRoles.includes(role),
		);
		if (!isMatchRole) {
			return res.status(403).send({
				message:
					'Forbidden: You do not have permission to access this resource',
			});
		}

		next();
	};
};
