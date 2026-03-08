import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = GEMINI_API_KEY
	? new GoogleGenerativeAI(GEMINI_API_KEY)
	: null;

export class EmbeddingUtil {
	static readonly MODEL_NAME = 'text-embedding-004';

	static async generateEmbedding(
		text: string,
		taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT,
	): Promise<number[]> {
		if (!genAI) {
			throw new Error('Gemini API is not configured');
		}

		const model = genAI.getGenerativeModel({
			model: this.MODEL_NAME,
		});

		const result = await model.embedContent({
			content: { parts: [{ text }], role: 'user' },
			taskType,
		});

		return result.embedding.values;
	}

	static async generateQueryEmbedding(
		query: string,
	): Promise<number[]> {
		return this.generateEmbedding(query, TaskType.RETRIEVAL_QUERY);
	}

	static async generateEmbeddings(
		texts: string[],
		taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT,
		batchSize = 5,
		delayMs = 100,
	): Promise<number[][]> {
		if (!genAI) {
			throw new Error('Gemini API is not configured');
		}

		const embeddings: number[][] = [];

		for (let i = 0; i < texts.length; i += batchSize) {
			const batch = texts.slice(i, i + batchSize);

			const batchResults = await Promise.all(
				batch.map((text) => this.generateEmbedding(text, taskType)),
			);

			embeddings.push(...batchResults);

			if (i + batchSize < texts.length && delayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}

		return embeddings;
	}

	static createProductEmbeddingText(product: {
		name: string;
		description?: string;
		brief_description?: string;
		tags?: string[];
		category?: string;
		brand?: string;
		gender?: string;
	}): string {
		const parts: string[] = [
			product.name,
			product.brief_description || product.description || '',
			product.tags?.join(', ') || '',
			product.category || '',
			product.brand || '',
			product.gender || '',
		];

		return parts.filter(Boolean).join('. ');
	}

	static isConfigured(): boolean {
		return !!genAI;
	}
}

export default EmbeddingUtil;
