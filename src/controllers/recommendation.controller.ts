import { NextFunction, Request, Response } from 'express';
import { OK } from '../core/success.response';
import recommendationService from '../services/recommendation.service';

class RecommendationController {
	getPopularProducts = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const limit = Math.min(
			Math.max(parseInt(req.query.limit as string) || 10, 1),
			100,
		);

		const popularProducts =
			await recommendationService.getPopularProducts(limit);

		return new OK({
			message: 'Get popular products successful',
			data: popularProducts,
			meta: {
				limit,
				scoring: {
					purchaseWeight: 3,
					wishlistWeight: 2,
					viewWeight: 1,
				},
			},
		}).send(res, next);
	};

	refreshPopularCache = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const result = await recommendationService.refreshCache();

		return new OK({
			message: 'Popular products cache refreshed',
			data: result,
		}).send(res, next);
	};

	getPersonalizedProducts = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { userId } = req.params;
		const limit = Math.min(
			Math.max(parseInt(req.query.limit as string) || 10, 1),
			100,
		);

		const { products, fallback } =
			await recommendationService.getPersonalizedRecommendations(
				userId,
				limit,
			);

		return new OK({
			message: 'Get personalized recommendations successful',
			data: products,
			meta: {
				limit,
				fallback,
			},
		}).send(res, next);
	};
}

const recommendationController = new RecommendationController();

export default recommendationController;
