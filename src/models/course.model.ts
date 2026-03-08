import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Course';
export const COLLECTION_NAME = 'Courses';

export interface IPage {
	id: number;
	title: string;
	author_id: number;
	collection_id: number;
	page_id: number;
	slug: string;
}

export interface ICategory {
	id: string;
	title: string;
	summary: string;
	pages: IPage[];
}

export interface ITOC {
	categories: ICategory[];
}

export interface ICourse extends Document {
	title: string;
	summary: string;
	brief_summary: string;
	details?: string;
	clos: string[];
	toc: ITOC;
	tags: string[];
	target_audience: string;
	cover_image_serving_url: string;
	url_slug: string;
	read_time: number;
	learner_tags: string[];
	level_one_learner_tags: string[];
	views: number;
	embedding?: number[];
	createdAt?: Date;
	updatedAt?: Date;
}

const PageSchema = new Schema(
	{
		title: { type: String, required: true },
		author_id: { type: Number, required: true },
		collection_id: { type: Number, required: true },
		page_id: { type: Number, required: true },
		id: { type: Number, required: true },
		slug: { type: String, required: true },
	},
	{ _id: false },
);

const CategorySchema = new Schema(
	{
		title: { type: String, required: true },
		summary: { type: String, required: true },
		id: { type: String, required: true },
		pages: { type: [PageSchema], default: [] },
	},
	{ _id: false },
);

const TOCSchema = new Schema(
	{
		categories: { type: [CategorySchema], default: [] },
	},
	{ _id: false },
);

const CourseSchema = new Schema<ICourse>(
	{
		title: { type: String, required: true },
		summary: { type: String, required: true },
		brief_summary: { type: String, required: true },
		details: { type: String, default: '' },
		clos: { type: [String], default: [] },
		toc: { type: TOCSchema, required: true },
		tags: { type: [String], default: [] },
		target_audience: { type: String, required: true },
		cover_image_serving_url: { type: String, required: true },
		url_slug: { type: String, required: true, unique: true },
		read_time: { type: Number, default: 0 },
		learner_tags: { type: [String], default: [] },
		level_one_learner_tags: { type: [String], default: [] },
		views: { type: Number, default: 0 },
		// Vector embedding for semantic search (768 dimensions)
		// Note: Atlas Vector Search index must be created separately via Atlas UI
		embedding: { type: [Number], default: null },
	},
	{
		timestamps: true,
		collection: COLLECTION_NAME,
	},
);

CourseSchema.index(
	{
		title: 'text',
		summary: 'text',
		brief_summary: 'text',
		tags: 'text',
		learner_tags: 'text',
		level_one_learner_tags: 'text',
	},
	{
		weights: {
			title: 10,
			tags: 5,
			learner_tags: 5,
			level_one_learner_tags: 5,
			summary: 3,
			brief_summary: 2,
		},
		name: 'course_text_index',
	},
);

CourseSchema.index({ learner_tags: 1, createdAt: -1 });
CourseSchema.index({ level_one_learner_tags: 1, createdAt: -1 });
CourseSchema.index({ target_audience: 1, createdAt: -1 });
CourseSchema.index({ views: -1 });
CourseSchema.index({ createdAt: -1 });

const CourseModel = model<ICourse>(DOCUMENT_NAME, CourseSchema);

export default CourseModel;
