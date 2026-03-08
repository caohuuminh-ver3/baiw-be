import { NextFunction, Request, Response } from 'express';
import { CREATED, OK } from '../core/success.response';
import ProductService from '../services/product.service';
import {
	getPagination,
	getPaginationMetadata,
} from '../utils/pagination.util';

class ProductController {
	createProduct = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		return new CREATED({
			message: 'Create product successful !',
			data: await ProductService.createProduct(req.body),
		}).send(res);
	};

	updateProduct = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const product = await ProductService.updateProduct(
			req.params.id,
			req.body,
		);

		return new OK({
			message: 'Update product successful !',
			data: product,
		}).send(res, next);
	};

	getProductById = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { id } = req.params;
		const product = await ProductService.getProductById(id);

		if (!product) {
			return res.status(404).json({ message: 'Product not found' });
		}

		const user = (req as any).user;
		const userId = user?.userId;

		if (userId) {
			const ipAddress = req.ip || req.socket.remoteAddress;
			ProductService.incrementProductViews(id, userId, ipAddress).catch(
				(err) => console.error('Failed to increment views', err),
			);
		}

		return new OK({
			message: 'Get product successful !',
			data: product,
		}).send(res, next);
	};

	getAllProducts = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { page, limit, skip } = getPagination(req.query);
		const { search, category, gender } = req.query as any;

		const { products, total } = await ProductService.getAllProducts({
			limit,
			skip,
			search,
			category,
			gender,
		});

		return new OK({
			message: 'Get all products successful !',
			data: products,
			meta: {
				...getPaginationMetadata(total, page, limit),
			},
		}).send(res, next);
	};

	addToWishlist = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { productId } = req.params;

		const result = await ProductService.addToWishlist(userId, productId);

		return new CREATED({
			message: result.message,
			data: { saved: result.saved },
		}).send(res);
	};

	removeFromWishlist = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { productId } = req.params;

		const result = await ProductService.removeFromWishlist(userId, productId);

		return new OK({
			message: result.message,
			data: { saved: result.saved },
		}).send(res, next);
	};

	isInWishlist = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { productId } = req.params;

		const saved = await ProductService.isInWishlist(userId, productId);

		return new OK({
			message: 'Check wishlist status successful',
			data: { saved },
		}).send(res, next);
	};

	getWishlist = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { page, limit, skip } = getPagination(req.query);

		const { products, total } = await ProductService.getWishlist(
			userId,
			{
				limit,
				skip,
			},
		);

		return new OK({
			message: 'Get wishlist successful',
			data: products,
			meta: {
				...getPaginationMetadata(total, page, limit),
			},
		}).send(res, next);
	};

	addToCart = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;
		const { productId } = req.params;
		const { size, color, quantity } = req.body || {};

		const result = await ProductService.addToCart(userId, productId, {
			size,
			color,
			quantity: quantity || 1,
		});

		return new CREATED({
			message: result.message,
			data: { success: result.success },
		}).send(res);
	};

	getCart = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const userId = (req as any).user?.userId;

		const cart = await ProductService.getCart(userId);

		return new OK({
			message: 'Get cart successful',
			data: cart || { items: [] },
		}).send(res, next);
	};

	recomputeEmbeddings = async (
		req: Request,
		res: Response,
		next: NextFunction,
	) => {
		const { force, productId } = req.query;

		const result = await ProductService.recomputeEmbeddings({
			force: force === 'true',
			productId: productId as string | undefined,
		});

		return new OK({
			message: `Embedding recomputation complete: ${result.successful} successful, ${result.failed} failed`,
			data: result,
		}).send(res, next);
	};
}

const productController = new ProductController();

export default productController;
