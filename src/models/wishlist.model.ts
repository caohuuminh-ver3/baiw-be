import mongoose, { Document, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Wishlist';
export const COLLECTION_NAME = 'Wishlists';

export interface IWishlist extends Document {
	user_id: mongoose.Types.ObjectId;
	product_id: mongoose.Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
}

const WishlistSchema = new Schema<IWishlist>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		product_id: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

WishlistSchema.index({ user_id: 1, product_id: 1 }, { unique: true });
WishlistSchema.index({ user_id: 1, createdAt: -1 });

const WishlistModel = mongoose.model<IWishlist>(DOCUMENT_NAME, WishlistSchema);

export default WishlistModel;
