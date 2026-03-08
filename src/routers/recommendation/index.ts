import express from 'express';

import asyncHandler from '../../utils/async-handler';
import recommendationController from '../../controllers/recommendation.controller';

const router = express.Router();

router.get(
	'/recommendations/popular',
	asyncHandler(recommendationController.getPopularProducts),
);

router.get(
	'/recommendations/personalized/:userId',
	asyncHandler(recommendationController.getPersonalizedProducts),
);

router.post(
	'/recommendations/popular/refresh',
	asyncHandler(recommendationController.refreshPopularCache),
);

export default router;
