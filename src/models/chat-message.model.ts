import { Document, Schema, model } from 'mongoose';

export const DOCUMENT_NAME = 'ChatMessage';
export const COLLECTION_NAME = 'ChatMessages';

export interface IChatMessageMetadata {
	course_ids?: string[];
	tokens_used?: number;
	model?: string;
}

export interface IChatMessage extends Document {
	session_id: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	metadata?: IChatMessageMetadata;
	createdAt: Date;
}

const ChatMessageMetadataSchema = new Schema<IChatMessageMetadata>(
	{
		course_ids: { type: [String], default: [] },
		tokens_used: { type: Number, default: null },
		model: { type: String, default: null },
	},
	{ _id: false },
);

const ChatMessageSchema = new Schema<IChatMessage>(
	{
		session_id: { type: String, required: true, index: true },
		role: {
			type: String,
			required: true,
			enum: ['user', 'assistant', 'system'],
		},
		content: { type: String, required: true },
		metadata: { type: ChatMessageMetadataSchema, default: null },
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

ChatMessageSchema.index({ session_id: 1, createdAt: 1 });

const ChatMessageModel = model<IChatMessage>(
	DOCUMENT_NAME,
	ChatMessageSchema,
);

export default ChatMessageModel;
