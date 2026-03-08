import ProductViewModel from '../models/product-view.model';
import WishlistModel from '../models/wishlist.model';
import PurchaseModel from '../models/purchase.model';
import ProductModel, { IProduct } from '../models/product.model';

const PURCHASE_WEIGHT = 3;
const WISHLIST_WEIGHT = 2;
const VIEW_WEIGHT = 1;

const CACHE_TTL_MS = 60 * 60 * 1000;

interface ProductScore {
	productId: string;
	score: number;
}

class RecommendationService {
	private cache: {
		data: any[] | null;
		timestamp: number;
	} = {
		data: null,
		timestamp: 0,
	};

	async getPopularProducts(limit: number = 10): Promise<any[]> {
		const now = Date.now();
		if (
			this.cache.data &&
			now - this.cache.timestamp < CACHE_TTL_MS
		) {
			return this.cache.data.slice(0, limit);
		}

		const productScores = new Map<string, ProductScore>();

		const getOrCreateScore = (productId: string): ProductScore => {
			if (!productScores.has(productId)) {
				productScores.set(productId, {
					productId,
					score: 0,
				});
			}
			return productScores.get(productId)!;
		};

		const purchaseCounts = await PurchaseModel.aggregate([
			{ $unwind: '$items' },
			{
				$group: {
					_id: '$items.product_id',
					count: { $sum: 1 },
				},
			},
		]);

		for (const doc of purchaseCounts) {
			const productId = doc._id.toString();
			const score = getOrCreateScore(productId);
			score.score += doc.count * PURCHASE_WEIGHT;
		}

		const wishlistCounts = await WishlistModel.aggregate([
			{
				$match: { product_id: { $exists: true, $ne: null } },
			},
			{
				$group: {
					_id: '$product_id',
					count: { $sum: 1 },
				},
			},
		]);

		for (const doc of wishlistCounts) {
			const productId = doc._id.toString();
			const score = getOrCreateScore(productId);
			score.score += doc.count * WISHLIST_WEIGHT;
		}

		const viewCounts = await ProductViewModel.aggregate([
			{
				$match: { product_id: { $exists: true, $ne: null } },
			},
			{
				$group: {
					_id: '$product_id',
					count: { $sum: 1 },
				},
			},
		]);

		for (const doc of viewCounts) {
			const productId = doc._id.toString();
			const score = getOrCreateScore(productId);
			score.score += doc.count * VIEW_WEIGHT;
		}

		const sortedScores = Array.from(productScores.values()).sort(
			(a, b) => b.score - a.score,
		);

		const topProductIds = sortedScores
			.slice(0, 100)
			.map((s) => s.productId);

		const products = await ProductModel.find({
			_id: { $in: topProductIds },
		}).lean();

		const productMap = new Map(
			products.map((c) => [c._id.toString(), c]),
		);

		const result = sortedScores
			.slice(0, 100)
			.filter((s) => productMap.has(s.productId))
			.map((s) => productMap.get(s.productId));

		this.cache = {
			data: result,
			timestamp: now,
		};

		return result.slice(0, limit);
	}

	async refreshCache(): Promise<{ count: number }> {
		this.cache = { data: null, timestamp: 0 };
		const products = await this.getPopularProducts(10);
		return { count: products.length };
	}

	async getPersonalizedRecommendations(
		userId: string,
		limit: number = 10,
	) {
		const FPGROWTH_API_URL =
			process.env.FPGROWTH_API_URL || 'http://localhost:8000';

		try {
			const response = await fetch(
				`${FPGROWTH_API_URL}/fpgrowth/${userId}?top_k=${limit}`,
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			const { recommendations, fallback } = data as {
				user_id: string;
				recommendations: { item_id: string; score: number }[];
				fallback: boolean;
			};

			if (!recommendations || recommendations.length === 0) {
				return { products: [], fallback: true };
			}

			const productIds = recommendations.map((r) => r.item_id);

			const products = await ProductModel.find({
				_id: { $in: productIds },
			}).lean();

			const productMap = new Map(
				products.map((c) => [c._id.toString(), c]),
			);
			const sortedProducts = productIds
				.filter((id) => productMap.has(id))
				.map((id) => productMap.get(id));

			return { products: sortedProducts, fallback };
		} catch (error) {
			console.error('FP-Growth API error:', error);
			const products = await this.getPopularProducts(limit);
			return { products, fallback: true };
		}
	}

	invalidateCache(): void {
		this.cache = { data: null, timestamp: 0 };
	}
}

const recommendationService = new RecommendationService();

export default recommendationService;
