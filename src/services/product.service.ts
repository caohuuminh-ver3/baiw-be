import ProductModel, { type IProduct } from '../models/product.model';
import ProductViewModel from '../models/product-view.model';
import WishlistModel from '../models/wishlist.model';
import CartModel from '../models/cart.model';
import { CreateProductDto } from '../dtos/product.dto';
import { NotFoundError } from '../core/error.response';
import EmbeddingUtil from '../utils/embedding.util';

export class ProductService {
	private static readonly EMBEDDING_BATCH_SIZE = 5;
	private static readonly EMBEDDING_BATCH_DELAY_MS = 500;
	private static readonly EMBEDDING_FIELDS = [
		'name',
		'description',
		'brief_description',
		'tags',
		'category',
		'brand',
		'gender',
	] as const;

	private static async generateAndSaveEmbedding(
		product: IProduct,
	): Promise<IProduct> {
		if (!EmbeddingUtil.isConfigured()) {
			console.warn(
				`[ProductService] Embedding not generated for product ${product._id}: GEMINI_API_KEY not configured`,
			);
			return product;
		}

		try {
			const textToEmbed = EmbeddingUtil.createProductEmbeddingText({
				name: product.name,
				description: product.description,
				brief_description: product.brief_description,
				tags: product.tags,
				category: product.category,
				brand: product.brand,
				gender: product.gender,
			});

			const embedding =
				await EmbeddingUtil.generateEmbedding(textToEmbed);

			const updatedProduct = await ProductModel.findByIdAndUpdate(
				product._id,
				{ $set: { embedding } },
				{ new: true },
			);

			console.log(
				`[ProductService] Embedding generated for product ${product._id}: ${product.name}`,
			);

			return updatedProduct || product;
		} catch (error) {
			console.error(
				`[ProductService] Failed to generate embedding for product ${product._id}:`,
				error,
			);
			return product;
		}
	}

	static async createProduct(data: CreateProductDto) {
		const product = await ProductModel.create(data);
		return await this.generateAndSaveEmbedding(product);
	}

	private static hasEmbeddingFieldsChanged(
		data: Partial<IProduct>,
	): boolean {
		return this.EMBEDDING_FIELDS.some(
			(field) => data[field] !== undefined,
		);
	}

	static async updateProduct(id: string, data: Partial<IProduct>) {
		const product = await ProductModel.findByIdAndUpdate(id, data, {
			new: true,
			runValidators: true,
		});
		if (!product) {
			throw new NotFoundError('Product not found !');
		}

		if (this.hasEmbeddingFieldsChanged(data)) {
			return await this.generateAndSaveEmbedding(product);
		}

		return product;
	}

	static async getProductById(id: string) {
		return ProductModel.findById(id).lean();
	}

	static async getAllProducts({
		limit = 50,
		skip = 0,
		search,
		category,
		gender,
	}: {
		limit?: number;
		skip?: number;
		search?: string;
		category?: string;
		gender?: string;
	} = {}) {
		let query: Record<string, any> = {};

		if (search && search.trim()) {
			query.$text = { $search: search.trim() };
		}

		if (category && category !== 'all') {
			query.category = category;
		}

		if (gender && gender !== 'all') {
			query.gender = gender;
		}

		let sortCriteria: Record<string, any> = { createdAt: -1 };
		if (search && search.trim()) {
			sortCriteria = { score: { $meta: 'textScore' }, createdAt: -1 };
		}

		const [products, total] = await Promise.all([
			ProductModel.find(query)
				.skip(skip)
				.limit(limit)
				.lean()
				.sort(sortCriteria),
			ProductModel.countDocuments(query),
		]);

		return {
			products,
			total,
		};
	}

	static async incrementProductViews(
		id: string,
		userId?: string,
		ipAddress?: string,
	) {
		if (!userId && !ipAddress) {
			return;
		}

		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

		const query: any = {
			product_id: id,
			viewedAt: { $gte: fiveMinutesAgo },
		};

		if (userId) {
			query.user_id = userId;
		} else {
			query.ip_address = ipAddress;
		}

		const existingView = await ProductViewModel.findOne(query);

		if (existingView) {
			return;
		}

		await ProductViewModel.create({
			product_id: id,
			user_id: userId,
			ip_address: ipAddress,
		});

		return ProductModel.findByIdAndUpdate(id, { $inc: { views: 1 } });
	}

	static async addToWishlist(userId: string, productId: string) {
		const existing = await WishlistModel.findOne({
			user_id: userId,
			product_id: productId,
		});

		if (existing) {
			return { saved: true, message: 'Product already in wishlist' };
		}

		await WishlistModel.create({
			user_id: userId,
			product_id: productId,
		});

		return { saved: true, message: 'Product added to wishlist' };
	}

	static async removeFromWishlist(userId: string, productId: string) {
		const result = await WishlistModel.findOneAndDelete({
			user_id: userId,
			product_id: productId,
		});

		if (!result) {
			return { saved: false, message: 'Product was not in wishlist' };
		}

		return { saved: false, message: 'Product removed from wishlist' };
	}

	static async isInWishlist(
		userId: string,
		productId: string,
	): Promise<boolean> {
		const saved = await WishlistModel.findOne({
			user_id: userId,
			product_id: productId,
		});

		return !!saved;
	}

	static async getWishlist(
		userId: string,
		{ limit = 50, skip = 0 }: { limit?: number; skip?: number } = {},
	) {
		const [wishlistItems, total] = await Promise.all([
			WishlistModel.find({ user_id: userId })
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(limit)
				.populate('product_id')
				.lean(),
			WishlistModel.countDocuments({ user_id: userId }),
		]);

		const products = wishlistItems.map((w: any) => w.product_id);

		return { products, total };
	}

	static async addToCart(
		userId: string,
		productId: string,
		{ size, color, quantity = 1 }: { size?: string; color?: string; quantity?: number } = {},
	) {
		let cart = await CartModel.findOne({ user_id: userId });

		if (!cart) {
			cart = await CartModel.create({
				user_id: userId,
				items: [],
			});
		}

		const existingIndex = cart.items.findIndex(
			(item) =>
				item.product_id.toString() === productId &&
				item.size === (size || '') &&
				item.color === (color || ''),
		);

		if (existingIndex >= 0) {
			cart.items[existingIndex].quantity += quantity;
		} else {
			cart.items.push({
				product_id: productId as any,
				size: size || '',
				color: color || '',
				quantity,
			});
		}

		await cart.save();
		return { success: true, message: 'Added to cart' };
	}

	static async getCart(userId: string) {
		const cart = await CartModel.findOne({ user_id: userId })
			.populate('items.product_id')
			.lean();
		return cart;
	}

	static async removeFromCart(
		userId: string,
		productId: string,
		{ size, color }: { size?: string; color?: string } = {},
	) {
		const cart = await CartModel.findOne({ user_id: userId });
		if (!cart) return { success: false, message: 'Cart not found' };

		cart.items = cart.items.filter(
			(item) =>
				!(
					item.product_id.toString() === productId &&
					item.size === (size || '') &&
					item.color === (color || '')
				),
		) as any;

		await cart.save();
		return { success: true, message: 'Removed from cart' };
	}

	static async updateCartItem(
		userId: string,
		productId: string,
		{ size, color, quantity }: { size?: string; color?: string; quantity: number },
	) {
		const cart = await CartModel.findOne({ user_id: userId });
		if (!cart) return { success: false, message: 'Cart not found' };

		const item = cart.items.find(
			(item) =>
				item.product_id.toString() === productId &&
				item.size === (size || '') &&
				item.color === (color || ''),
		);

		if (!item) return { success: false, message: 'Item not found in cart' };

		if (quantity <= 0) {
			cart.items = cart.items.filter((i) => i !== item) as any;
		} else {
			item.quantity = quantity;
		}

		await cart.save();
		return { success: true, message: 'Cart updated' };
	}

	static async recomputeEmbeddings(
		options: {
			force?: boolean;
			productId?: string;
		} = {},
	): Promise<{
		processed: number;
		successful: number;
		failed: number;
		errors: { productId: string; name: string; error: string }[];
	}> {
		const { force = false, productId } = options;

		if (!EmbeddingUtil.isConfigured()) {
			throw new Error(
				'Embedding service is not configured. Please set GEMINI_API_KEY.',
			);
		}

		let products: IProduct[];

		if (productId) {
			const product = await ProductModel.findById(productId);
			if (!product) {
				throw new NotFoundError(`Product not found: ${productId}`);
			}
			products = [product];
		} else if (force) {
			products = await ProductModel.find({});
		} else {
			products = await ProductModel.find({
				$or: [
					{ embedding: null },
					{ embedding: { $exists: false } },
					{ embedding: { $size: 0 } },
				],
			});
		}

		const totalProducts = products.length;

		if (totalProducts === 0) {
			return {
				processed: 0,
				successful: 0,
				failed: 0,
				errors: [],
			};
		}

		let processed = 0;
		let successful = 0;
		let failed = 0;
		const errors: {
			productId: string;
			name: string;
			error: string;
		}[] = [];

		for (
			let i = 0;
			i < products.length;
			i += this.EMBEDDING_BATCH_SIZE
		) {
			const batch = products.slice(i, i + this.EMBEDDING_BATCH_SIZE);

			const batchPromises = batch.map(async (product) => {
				try {
					const textToEmbed = EmbeddingUtil.createProductEmbeddingText({
						name: product.name,
						description: product.description,
						brief_description: product.brief_description,
						tags: product.tags,
						category: product.category,
						brand: product.brand,
						gender: product.gender,
					});

					const embedding =
						await EmbeddingUtil.generateEmbedding(textToEmbed);

					await ProductModel.updateOne(
						{ _id: product._id },
						{ $set: { embedding } },
					);

					successful++;
					return { success: true };
				} catch (error) {
					failed++;
					const errorMsg =
						error instanceof Error ? error.message : String(error);
					errors.push({
						productId: product._id.toString(),
						name: product.name,
						error: errorMsg,
					});
					return { success: false };
				}
			});

			await Promise.all(batchPromises);
			processed += batch.length;

			if (i + this.EMBEDDING_BATCH_SIZE < products.length) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.EMBEDDING_BATCH_DELAY_MS),
				);
			}
		}

		return {
			processed,
			successful,
			failed,
			errors,
		};
	}
}

export default ProductService;
