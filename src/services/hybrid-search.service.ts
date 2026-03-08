import type { PipelineStage } from 'mongoose';
import ProductModel, { type IProduct } from '../models/product.model';
import EmbeddingUtil from '../utils/embedding.util';

type VectorSearchStage = {
	$vectorSearch: {
		index: string;
		path: string;
		queryVector: number[];
		numCandidates: number;
		limit: number;
		filter?: Record<string, unknown>;
	};
};

export interface SearchResult {
	product: IProduct;
	score: number;
	source: 'vector' | 'fulltext' | 'both';
}

interface RankedResult {
	productId: string;
	product: IProduct;
	vectorRank?: number;
	fulltextRank?: number;
	rrfScore: number;
}

export class HybridSearchService {
	private static readonly RRF_K = 60;
	private static readonly SEARCH_LIMIT_MULTIPLIER = 2;

	static async vectorSearch(
		queryEmbedding: number[],
		limit: number,
	): Promise<SearchResult[]> {
		try {
			const vectorSearchStage: VectorSearchStage = {
				$vectorSearch: {
					index: 'vector_index',
					path: 'embedding',
					queryVector: queryEmbedding,
					numCandidates: limit * 10,
					limit: limit,
				},
			};

			const results = await ProductModel.aggregate([
				vectorSearchStage as unknown as PipelineStage,
				{
					$project: {
						_id: 1,
						name: 1,
						description: 1,
						brief_description: 1,
						category: 1,
						brand: 1,
						price: 1,
						images: 1,
						sizes: 1,
						colors: 1,
						tags: 1,
						url_slug: 1,
						views: 1,
						createdAt: 1,
						updatedAt: 1,
						score: { $meta: 'vectorSearchScore' },
					},
				},
			]);

			return results.map((doc) => ({
				product: doc as IProduct,
				score: doc.score || 0,
				source: 'vector' as const,
			}));
		} catch (error) {
			console.warn('Vector search failed:', error);
			return [];
		}
	}

	static async fullTextSearch(
		query: string,
		limit: number,
	): Promise<SearchResult[]> {
		try {
			const results = await ProductModel.find(
				{ $text: { $search: query } },
				{ score: { $meta: 'textScore' } },
			)
				.sort({ score: { $meta: 'textScore' } })
				.limit(limit)
				.lean();

			return results.map((doc) => ({
				product: doc as IProduct,
				score: (doc as any).score || 0,
				source: 'fulltext' as const,
			}));
		} catch (error) {
			console.warn('Full-text search failed:', error);
			return [];
		}
	}

	static fuseResults(
		vectorResults: SearchResult[],
		fulltextResults: SearchResult[],
		k: number = this.RRF_K,
	): SearchResult[] {
		const resultMap = new Map<string, RankedResult>();

		vectorResults.forEach((result, index) => {
			const productId = result.product._id.toString();
			resultMap.set(productId, {
				productId,
				product: result.product,
				vectorRank: index + 1,
				rrfScore: 1 / (k + index + 1),
			});
		});

		fulltextResults.forEach((result, index) => {
			const productId = result.product._id.toString();
			const existing = resultMap.get(productId);

			if (existing) {
				existing.fulltextRank = index + 1;
				existing.rrfScore += 1 / (k + index + 1);
			} else {
				resultMap.set(productId, {
					productId,
					product: result.product,
					fulltextRank: index + 1,
					rrfScore: 1 / (k + index + 1),
				});
			}
		});

		const sortedResults = Array.from(resultMap.values())
			.sort((a, b) => b.rrfScore - a.rrfScore)
			.map((ranked) => {
				let source: 'vector' | 'fulltext' | 'both';
				if (ranked.vectorRank && ranked.fulltextRank) {
					source = 'both';
				} else if (ranked.vectorRank) {
					source = 'vector';
				} else {
					source = 'fulltext';
				}

				return {
					product: ranked.product,
					score: ranked.rrfScore,
					source,
				};
			});

		return sortedResults;
	}

	static async search(
		query: string,
		limit: number = 5,
	): Promise<SearchResult[]> {
		const searchLimit = limit * this.SEARCH_LIMIT_MULTIPLIER;

		const canUseVectorSearch = EmbeddingUtil.isConfigured();

		const [vectorResults, fulltextResults] = await Promise.all([
			canUseVectorSearch
				? EmbeddingUtil.generateQueryEmbedding(query).then(
						(embedding) => this.vectorSearch(embedding, searchLimit),
					)
				: Promise.resolve([]),
			this.fullTextSearch(query, searchLimit),
		]);

		if (vectorResults.length === 0 && fulltextResults.length === 0) {
			return [];
		}

		if (vectorResults.length === 0) {
			return fulltextResults.slice(0, limit);
		}

		if (fulltextResults.length === 0) {
			return vectorResults.slice(0, limit);
		}

		const fusedResults = this.fuseResults(
			vectorResults,
			fulltextResults,
		);

		return fusedResults.slice(0, limit);
	}

	static async searchByProductId(
		productId: string,
	): Promise<SearchResult[]> {
		const product = await ProductModel.findById(productId).lean();

		if (!product) {
			return [];
		}

		return [
			{
				product: product as IProduct,
				score: 1.0,
				source: 'fulltext' as const,
			},
		];
	}

	static async findSimilarProducts(
		productId: string,
		limit: number = 5,
	): Promise<SearchResult[]> {
		const product = await ProductModel.findById(productId).lean();

		if (!product) {
			return [];
		}

		const searchQuery = [
			product.name,
			product.tags?.join(' ') || '',
			product.category || '',
			product.brand || '',
		]
			.filter(Boolean)
			.join(' ');

		const searchResults = await this.search(searchQuery, limit + 1);

		return searchResults
			.filter((result) => result.product._id.toString() !== productId)
			.slice(0, limit);
	}
}

export default HybridSearchService;
