import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'ProductView';
export const COLLECTION_NAME = 'ProductViews';

export interface IProductView extends Document {
	product_id: Schema.Types.ObjectId;
	user_id?: Schema.Types.ObjectId;
	ip_address?: string;
	viewedAt: Date;
}

const ProductViewSchema = new Schema<IProductView>(
	{
		product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		user_id: { type: Schema.Types.ObjectId, ref: 'User' },
		ip_address: { type: String },
		viewedAt: { type: Date, default: Date.now },
	},
	{
		collection: COLLECTION_NAME,
	},
);

ProductViewSchema.index({ product_id: 1, user_id: 1, viewedAt: -1 });
ProductViewSchema.index({ product_id: 1, ip_address: 1, viewedAt: -1 });
ProductViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 86400 });

const ProductViewModel = model<IProductView>(DOCUMENT_NAME, ProductViewSchema);

export default ProductViewModel;
