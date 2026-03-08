import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Purchase';
export const COLLECTION_NAME = 'Purchases';

export interface IPurchaseItem {
	product_id: Schema.Types.ObjectId;
	size?: string;
	color?: string;
	quantity: number;
	price: number;
}

export interface IPurchase extends Document {
	user_id: Schema.Types.ObjectId;
	items: IPurchaseItem[];
	total: number;
	status: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const PurchaseItemSchema = new Schema(
	{
		product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		size: { type: String, default: '' },
		color: { type: String, default: '' },
		quantity: { type: Number, required: true, min: 1 },
		price: { type: Number, required: true },
	},
	{ _id: false },
);

const PurchaseSchema = new Schema<IPurchase>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		items: { type: [PurchaseItemSchema], required: true },
		total: { type: Number, required: true },
		status: { type: String, default: 'completed' },
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

PurchaseSchema.index({ user_id: 1, createdAt: -1 });

const PurchaseModel = model<IPurchase>(DOCUMENT_NAME, PurchaseSchema);

export default PurchaseModel;
