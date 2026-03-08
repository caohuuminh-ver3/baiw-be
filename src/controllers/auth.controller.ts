import { NextFunction, Request, Response } from 'express';
import { CREATED, OK } from '../core/success.response';
import AuthService from '../services/auth.service';
import { UnauthorizedError } from '../core/error.response';

class AuthController {
	signup = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		return new CREATED({
			message: 'Register successful !',
			data: await AuthService.signup(req.body),
		}).send(res);
	};

	login = async (req: Request, res: Response, next: NextFunction) => {
		const result = await AuthService.login(req.body);
		const { user, tokens } = result;

		res.cookie('refreshToken', tokens.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite:
				process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		return new OK({
			message: 'Login successful !',
			data: {
				user,
				tokens: {
					accessToken: tokens.accessToken,
				},
			},
		}).send(res);
	};

	refreshToken = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const refreshToken = req.cookies.refreshToken;
		if (!refreshToken) {
			throw new UnauthorizedError('No refresh token provided');
		}

		const result = await AuthService.refreshToken(refreshToken);

		res.cookie('refreshToken', result.tokens.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite:
				process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		return new OK({
			message: 'Token refreshed successfully !',
			data: {
				user: result.user,
				tokens: {
					accessToken: result.tokens.accessToken,
				},
			},
		}).send(res, next);
	};

	logout = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user.userId;
		const result = await AuthService.logout(userId);
		res.clearCookie('refreshToken');
		return new OK({
			message: result
				? 'Logout successful !'
				: 'No active session found',
			data: { success: result },
		}).send(res, next);
	};
}

const authController = new AuthController();

export default authController;
