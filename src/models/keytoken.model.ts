import { Document, model, Schema, Types } from 'mongoose';

export const DOCUMENT_NAME = 'KeyToken';
export const COLLECTION_NAME = 'KeyTokens';

export interface IKeyToken extends Document {
    userId: Types.ObjectId;
    publicKey: string;
    privateKey: string;
    refreshToken: string;
    refreshTokensUsed: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

const KeyTokenSchema = new Schema<IKeyToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        publicKey: {
            type: String,
            required: true,
        },
        privateKey: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
        },
        refreshTokensUsed: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
);

// Index for faster lookups
KeyTokenSchema.index({ userId: 1 });
KeyTokenSchema.index({ refreshToken: 1 });

const KeyTokenModel = model<IKeyToken>(DOCUMENT_NAME, KeyTokenSchema);

export default KeyTokenModel;
