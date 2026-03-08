import { Document, Schema, model } from 'mongoose';

export const DOCUMENT_NAME = 'ChatSession';
export const COLLECTION_NAME = 'ChatSessions';

export interface IChatSession extends Document {
	user_id?: string;
	session_id: string;
	title?: string;
	course_id?: string;
	createdAt: Date;
	updatedAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>(
	{
		user_id: { type: String, default: null },
		session_id: { type: String, required: true, unique: true },
		title: { type: String, default: null },
		course_id: { type: String, default: null },
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

ChatSessionSchema.index({ user_id: 1, createdAt: -1 });
ChatSessionSchema.index({ session_id: 1 });

const ChatSessionModel = model<IChatSession>(
	DOCUMENT_NAME,
	ChatSessionSchema,
);

export default ChatSessionModel;
