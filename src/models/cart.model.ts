import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Cart';
export const COLLECTION_NAME = 'Carts';

export interface ICartItem {
	product_id: Schema.Types.ObjectId;
	size?: string;
	color?: string;
	quantity: number;
}

export interface ICart extends Document {
	user_id: Schema.Types.ObjectId;
	items: ICartItem[];
	createdAt?: Date;
	updatedAt?: Date;
}

const CartItemSchema = new Schema(
	{
		product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		size: { type: String, default: '' },
		color: { type: String, default: '' },
		quantity: { type: Number, default: 1, min: 1 },
	},
	{ _id: false },
);

const CartSchema = new Schema<ICart>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		items: { type: [CartItemSchema], default: [] },
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

CartSchema.index({ user_id: 1 }, { unique: true });

const CartModel = model<ICart>(DOCUMENT_NAME, CartSchema);

export default CartModel;
