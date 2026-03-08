import express from 'express';

import asyncHandler from '../../utils/async-handler';
import productController from '../../controllers/product.controller';
import validateDto from '../../middlewares/validate';
import {
	CreateProductDto,
	UpdateProductDto,
} from '../../dtos/product.dto';
import {
	authenticate,
	authorize,
	optionalAuthenticate,
} from '../../middlewares/jwt.middleware';
import { Role } from '../../models/user.model';

const router = express.Router();

router.post(
	'/',
	validateDto(CreateProductDto),
	authenticate,
	authorize(Role.ADMIN),
	asyncHandler(productController.createProduct),
);
router.put(
	'/:id',
	validateDto(UpdateProductDto),
	authenticate,
	authorize(Role.ADMIN),
	asyncHandler(productController.updateProduct),
);
router.get('/products', asyncHandler(productController.getAllProducts));
router.get(
	'/products/:id',
	optionalAuthenticate,
	asyncHandler(productController.getProductById),
);

router.get(
	'/wishlist',
	authenticate,
	asyncHandler(productController.getWishlist),
);
router.get(
	'/wishlist/:productId/status',
	authenticate,
	asyncHandler(productController.isInWishlist),
);
router.post(
	'/wishlist/:productId',
	authenticate,
	asyncHandler(productController.addToWishlist),
);
router.delete(
	'/wishlist/:productId',
	authenticate,
	asyncHandler(productController.removeFromWishlist),
);

router.post(
	'/cart/:productId',
	authenticate,
	asyncHandler(productController.addToCart),
);
router.get(
	'/cart',
	authenticate,
	asyncHandler(productController.getCart),
);
router.delete(
	'/cart/:productId',
	authenticate,
	asyncHandler(productController.removeFromCart),
);
router.patch(
	'/cart/:productId',
	authenticate,
	asyncHandler(productController.updateCartItem),
);

router.post(
	'/recompute-embeddings',
	authenticate,
	authorize(Role.ADMIN),
	asyncHandler(productController.recomputeEmbeddings),
);

export default router;
