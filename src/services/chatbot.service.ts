import { v4 as uuidv4 } from 'uuid';

import ChatMessageModel, {
	type IChatMessage,
} from '../models/chat-message.model';
import ChatSessionModel, {
	type IChatSession,
} from '../models/chat-session.model';
import { type IProduct } from '../models/product.model';
import { SendMessageDto } from '../dtos/chatbot.dto';
import GeminiUtil, { type ChatMessage } from '../utils/gemini.util';
import {
	BadRequestError,
	ForbiddenError,
} from '../core/error.response';
import HybridSearchService from './hybrid-search.service';

export class ChatbotService {
	private static async retrieveProductContext(
		query: string,
		productId?: string,
		limit = 5,
	): Promise<IProduct[]> {
		if (productId) {
			const results =
				await HybridSearchService.searchByProductId(productId);
			return results.map((r) => r.product);
		}

		const searchResults = await HybridSearchService.search(
			query,
			limit,
		);
		return searchResults.map((r) => r.product);
	}

	private static formatProductContext(products: IProduct[]): string {
		if (products.length === 0) return '';

		return products
			.map((product, index) => {
				return `
**Product ${index + 1}: ${product.name}**
- Description: ${product.brief_description || product.description}
- Category: ${product.category || 'N/A'}
- Brand: ${product.brand || 'N/A'}
- Price: $${product.price}
- Tags: ${product.tags?.join(', ') || 'N/A'}
- Sizes: ${product.sizes?.join(', ') || 'N/A'}
- Colors: ${product.colors?.join(', ') || 'N/A'}
- URL: ${product.url_slug}
`.trim();
			})
			.join('\n\n');
	}

	private static async getOrCreateSession(
		sessionId?: string,
		userId?: string,
		productId?: string,
	): Promise<IChatSession> {
		if (sessionId) {
			const existing = await ChatSessionModel.findOne({
				session_id: sessionId,
			});
			if (existing) return existing;
		}

		const newSessionId = sessionId || uuidv4();
		const session = await ChatSessionModel.create({
			session_id: newSessionId,
			user_id: userId || null,
			course_id: productId || null,
		});

		return session;
	}

	private static async getChatHistory(
		sessionId: string,
		limit = 20,
	): Promise<IChatMessage[]> {
		return ChatMessageModel.find({ session_id: sessionId })
			.sort({ createdAt: -1 })
			.limit(limit)
			.lean()
			.then((messages) => messages.reverse());
	}

	private static formatHistoryForGemini(
		messages: IChatMessage[],
	): ChatMessage[] {
		const filtered = messages.filter((msg) => msg.role !== 'system');
		const firstUserIndex = filtered.findIndex((msg) => msg.role === 'user');
		const normalized =
			firstUserIndex === -1 ? [] : filtered.slice(firstUserIndex);

		return normalized.map((msg) => ({
			role: msg.role === 'assistant' ? 'model' : 'user',
			parts: [{ text: msg.content }],
		}));
	}

	static async chat(
		dto: SendMessageDto,
		userId?: string,
	): Promise<{
		session_id: string;
		message: {
			role: 'assistant';
			content: string;
			referenced_products?: Partial<IProduct>[];
		};
	}> {
		if (!GeminiUtil.isConfigured()) {
			throw new BadRequestError(
				'Chatbot is not configured. Please set GEMINI_API_KEY.',
			);
		}

		const productId = dto.course_id;

		const session = await this.getOrCreateSession(
			dto.session_id,
			userId,
			productId,
		);

		await ChatMessageModel.create({
			session_id: session.session_id,
			role: 'user',
			content: dto.message,
		});

		const contextProducts = await this.retrieveProductContext(
			dto.message,
			productId,
		);

		let displayProducts: IProduct[];
		if (productId) {
			const similarResults =
				await HybridSearchService.findSimilarProducts(
					productId,
					5,
				);
			displayProducts = similarResults.map((r) => r.product);
		} else {
			displayProducts = contextProducts;
		}

		const context = this.formatProductContext(contextProducts);

		const history = await this.getChatHistory(session.session_id);
		const geminiHistory = this.formatHistoryForGemini(
			history.slice(0, -1),
		);

		let text: string;
		let tokensUsed: number | undefined;

		try {
			const result = await GeminiUtil.generateContent(
				dto.message,
				geminiHistory,
				context,
			);
			text = result.text;
			tokensUsed = result.tokensUsed;
		} catch (error) {
			console.error('Gemini API error:', error);
			const errorMessage = this.getAIErrorMessage(error);
			text = errorMessage;
			tokensUsed = undefined;
		}

		await ChatMessageModel.create({
			session_id: session.session_id,
			role: 'assistant',
			content: text,
			metadata: {
				course_ids: displayProducts.map((c) => c._id.toString()),
				tokens_used: tokensUsed,
				model: GeminiUtil.MODEL_NAME,
			},
		});

		if (!session.title && dto.message.length > 0) {
			const title =
				dto.message.length > 50
					? dto.message.substring(0, 50) + '...'
					: dto.message;
			await ChatSessionModel.updateOne(
				{ _id: session._id },
				{ title },
			);
		}

		return {
			session_id: session.session_id,
			message: {
				role: 'assistant',
				content: text,
				referenced_products:
					displayProducts.length > 0
						? displayProducts.map((c) => ({
								_id: c._id,
								name: c.name,
								brief_description: c.brief_description,
								url_slug: c.url_slug,
								images: c.images,
								price: c.price,
							}))
						: undefined,
			},
		};
	}

	private static getAIErrorMessage(error: unknown): string {
		const errorStr = String(error);

		if (errorStr.includes('SAFETY') || errorStr.includes('blocked')) {
			return 'Sorry, I cannot answer this question due to content policy violations. Please try asking differently.';
		}

		if (
			errorStr.includes('quota') ||
			errorStr.includes('rate limit') ||
			errorStr.includes('429')
		) {
			return 'The system is busy. Please try again in a few minutes.';
		}

		if (
			errorStr.includes('timeout') ||
			errorStr.includes('ETIMEDOUT')
		) {
			return 'The request took too long. Please try again.';
		}

		if (
			errorStr.includes('network') ||
			errorStr.includes('ECONNREFUSED')
		) {
			return 'Unable to connect to the AI service. Please try again later.';
		}

		return 'Sorry, an error occurred while processing your request. Please try again later.';
	}

	static async getHistory(sessionId: string, userId?: string) {
		const session = await ChatSessionModel.findOne({
			session_id: sessionId,
		}).lean();
		if (!session) {
			return null;
		}

		if (session.user_id && session.user_id !== userId) {
			throw new ForbiddenError(
				'You do not have permission to access this chat session',
			);
		}

		const messages = await this.getChatHistory(sessionId, 100);

		return {
			session,
			messages: messages.map((msg) => ({
				id: msg._id,
				role: msg.role,
				content: msg.content,
				createdAt: msg.createdAt,
				metadata: msg.metadata,
			})),
		};
	}

	static async getUserSessions(
		userId: string,
		{ limit = 20, skip = 0 }: { limit?: number; skip?: number } = {},
	) {
		const [sessions, total] = await Promise.all([
			ChatSessionModel.find({ user_id: userId })
				.sort({ updatedAt: -1 })
				.skip(skip)
				.limit(limit)
				.lean(),
			ChatSessionModel.countDocuments({ user_id: userId }),
		]);

		return { sessions, total };
	}

	static async *chatStream(
		dto: SendMessageDto,
		userId?: string,
	): AsyncGenerator<
		| { type: 'token'; content: string }
		| { type: 'metadata'; session_id: string; referenced_products?: Partial<IProduct>[] }
		| { type: 'error'; content: string },
		void,
		unknown
	> {
		if (!GeminiUtil.isConfigured()) {
			yield { type: 'error', content: 'Chatbot is not configured. Please set GEMINI_API_KEY.' };
			return;
		}

		const productId = dto.course_id;

		const session = await this.getOrCreateSession(
			dto.session_id,
			userId,
			productId,
		);

		await ChatMessageModel.create({
			session_id: session.session_id,
			role: 'user',
			content: dto.message,
		});

		const contextProducts = await this.retrieveProductContext(
			dto.message,
			productId,
		);

		let displayProducts: IProduct[];
		if (productId) {
			const similarResults = await HybridSearchService.findSimilarProducts(
				productId,
				5,
			);
			displayProducts = similarResults.map((r) => r.product);
		} else {
			displayProducts = contextProducts;
		}

		const context = this.formatProductContext(contextProducts);
		const history = await this.getChatHistory(session.session_id);
		const geminiHistory = this.formatHistoryForGemini(history.slice(0, -1));

		let fullText = '';

		try {
			const stream = GeminiUtil.generateContentStream(
				dto.message,
				geminiHistory,
				context,
			);

			for await (const token of stream) {
				fullText += token;
				yield { type: 'token', content: token };
			}
		} catch (error) {
			console.error('Gemini API error:', error);
			const errorMessage = this.getAIErrorMessage(error);
			yield { type: 'error', content: errorMessage };
			fullText = errorMessage;
		}

		await ChatMessageModel.create({
			session_id: session.session_id,
			role: 'assistant',
			content: fullText,
			metadata: {
				course_ids: displayProducts.map((c) => c._id.toString()),
				model: GeminiUtil.MODEL_NAME,
			},
		});

		if (!session.title && dto.message.length > 0) {
			const title =
				dto.message.length > 50
					? dto.message.substring(0, 50) + '...'
					: dto.message;
			await ChatSessionModel.updateOne({ _id: session._id }, { title });
		}

		yield {
			type: 'metadata',
			session_id: session.session_id,
			referenced_products:
				displayProducts.length > 0
					? displayProducts.map((c) => ({
							_id: c._id,
							name: c.name,
							brief_description: c.brief_description,
							url_slug: c.url_slug,
							images: c.images,
							price: c.price,
						}))
					: undefined,
		};
	}
}

export default ChatbotService;
