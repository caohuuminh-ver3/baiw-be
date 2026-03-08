import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'CourseView';
export const COLLECTION_NAME = 'CourseViews';

export interface ICourseView extends Document {
  course_id: Schema.Types.ObjectId;
  user_id?: Schema.Types.ObjectId;
  ip_address?: string;
  viewedAt: Date;
}

const CourseViewSchema = new Schema<ICourseView>(
  {
    course_id: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    ip_address: { type: String },
    viewedAt: { type: Date, default: Date.now },
  },
  {
    collection: COLLECTION_NAME,
  },
);

CourseViewSchema.index({ course_id: 1, user_id: 1, viewedAt: -1 });
CourseViewSchema.index({ course_id: 1, ip_address: 1, viewedAt: -1 });

// Optional: TTL index to automatically expire records after 1 day (86400 seconds)
CourseViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 86400 });

const CourseViewModel = model<ICourseView>(DOCUMENT_NAME, CourseViewSchema);

export default CourseViewModel;
