import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Product';
export const COLLECTION_NAME = 'Products';

export interface IProduct extends Document {
	name: string;
	description: string;
	brief_description: string;
	category: string;
	subcategory?: string;
	brand: string;
	price: number;
	compare_at_price?: number;
	images: string[];
	sizes: string[];
	colors: string[];
	tags: string[];
	material?: string;
	gender?: string;
	stock: number;
	sku: string;
	url_slug: string;
	views: number;
	embedding?: number[];
	createdAt?: Date;
	updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		brief_description: { type: String, required: true },
		category: { type: String, required: true },
		subcategory: { type: String, default: '' },
		brand: { type: String, required: true },
		price: { type: Number, required: true },
		compare_at_price: { type: Number, default: null },
		images: { type: [String], default: [] },
		sizes: { type: [String], default: [] },
		colors: { type: [String], default: [] },
		tags: { type: [String], default: [] },
		material: { type: String, default: '' },
		gender: { type: String, default: 'unisex' },
		stock: { type: Number, default: 0 },
		sku: { type: String, required: true, unique: true },
		url_slug: { type: String, required: true, unique: true },
		views: { type: Number, default: 0 },
		embedding: { type: [Number], default: null },
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

ProductSchema.index(
	{
		name: 'text',
		description: 'text',
		brief_description: 'text',
		tags: 'text',
		brand: 'text',
		category: 'text',
	},
	{
		weights: {
			name: 10,
			tags: 5,
			brand: 5,
			category: 5,
			description: 3,
			brief_description: 2,
		},
		name: 'product_text_index',
	},
);

ProductSchema.index({ category: 1, createdAt: -1 });
ProductSchema.index({ brand: 1, createdAt: -1 });
ProductSchema.index({ gender: 1, createdAt: -1 });
ProductSchema.index({ views: -1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });

const ProductModel = model<IProduct>(DOCUMENT_NAME, ProductSchema);

export default ProductModel;
