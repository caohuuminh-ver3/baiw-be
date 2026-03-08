import {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
	type Content,
} from '@google/generative-ai';

import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
	console.warn(
		'GEMINI_API_KEY is not set. Chatbot will not work properly.',
	);
}

const genAI = GEMINI_API_KEY
	? new GoogleGenerativeAI(GEMINI_API_KEY)
	: null;

const SYSTEM_PROMPT = `
<role>You are StyleBot, a helpful AI assistant for a clothing and fashion e-commerce store. Your goal is to help users discover clothing items, answer questions about products, suggest outfits, and guide their shopping experience.</role>

<context_instructions>
The following section contains retrieved product information from our database. Each product includes key details like name, description, category, brand, price, sizes, colors, etc. Use ONLY this information to answer questions. Do not invent or add external knowledge.

If the provided context doesn't contain relevant information for the user's question, respond: "I don't have information on that. Try searching for products or browse our collection for assistance."
</context_instructions>

<response_rules>
- Respond concisely (2-4 sentences max per product mention).
- Always cite products using format: **Product Name** [brief reason - price, key features].
- Structure responses with markdown: use ## for main answer, ### for product recommendations, - bullets for lists.
- Match user's language if specified; default to English.
- Be helpful and stylish, like a friendly fashion advisor.
- For recommendations, prioritize matches by: category, style/tags, price range, brand.
- Suggest 3-5 top matching products max.
- End with a call-to-action: "Browse more styles?" or "Need help finding your size?"
</response_rules>

<output_format>
Answer the question directly based on the context above.
If recommending: 
### Recommended Products
- **Product Name**: Brief reason why it matches [key fields: category, price, style].
</output_format>

<examples>
User: "What casual shirts do you have?"
Context: Product1: name="Classic Cotton Tee", category="shirts", tags=["casual","cotton"], price=29.99
---
### Recommended Products
- **Classic Cotton Tee**: Perfect casual everyday shirt [category: shirts; tags: casual, cotton; $29.99].

User: "Show me summer dresses?"
Context: No relevant info
---
I don't have information on summer dresses. Try searching for products or browse our collection.
</examples>
`;

export interface ChatMessage {
	role: 'user' | 'model';
	parts: { text: string }[];
}

export class GeminiUtil {
	static readonly MODEL_NAME =
		process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-09-2025';

	private static getModel() {
		if (!genAI) {
			throw new Error('Gemini API is not configured');
		}
		return genAI.getGenerativeModel({
			model: this.MODEL_NAME,
			safetySettings: [
				{
					category: HarmCategory.HARM_CATEGORY_HARASSMENT,
					threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
				},
				{
					category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
					threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
				},
			],
		});
	}

	private static buildPrompt(
		prompt: string,
		context?: string,
	): string {
		return context
			? `${SYSTEM_PROMPT}\n\n### Related Product Information:\n${context}\n\n### User Question:\n${prompt}`
			: `${SYSTEM_PROMPT}\n\n### User Question:\n${prompt}`;
	}

	static async generateContent(
		prompt: string,
		history: ChatMessage[] = [],
		context?: string,
	): Promise<{ text: string; tokensUsed?: number }> {
		const model = this.getModel();
		const fullPrompt = this.buildPrompt(prompt, context);

		const chatHistory: Content[] = history.map((msg) => ({
			role: msg.role,
			parts: msg.parts,
		}));

		const chat = model.startChat({
			history: chatHistory,
		});

		const result = await chat.sendMessage(fullPrompt);
		const response = result.response;
		const text = response.text();

		return {
			text,
			tokensUsed: response.usageMetadata?.totalTokenCount,
		};
	}

	static async *generateContentStream(
		prompt: string,
		history: ChatMessage[] = [],
		context?: string,
	): AsyncGenerator<string, void, unknown> {
		const model = this.getModel();
		const fullPrompt = this.buildPrompt(prompt, context);

		const chatHistory: Content[] = history.map((msg) => ({
			role: msg.role,
			parts: msg.parts,
		}));

		const chat = model.startChat({
			history: chatHistory,
		});

		const result = await chat.sendMessageStream(fullPrompt);

		for await (const chunk of result.stream) {
			const text = chunk.text();
			if (text) {
				yield text;
			}
		}
	}

	static isConfigured(): boolean {
		return !!genAI;
	}
}

export default GeminiUtil;
