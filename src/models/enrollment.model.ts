import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Enrollment';
export const COLLECTION_NAME = 'Enrollments';

export interface IEnrollment extends Document {
  user_id: Schema.Types.ObjectId;
  course_id: Schema.Types.ObjectId;
  enrolledAt: Date;
  progress: number;
  completed: boolean;
  lastAccessedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    course_id: { type: Schema.Types.ObjectId, required: true, ref: 'Course' },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

EnrollmentSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
EnrollmentSchema.index({ user_id: 1 });
EnrollmentSchema.index({ course_id: 1 });

const EnrollmentModel = model<IEnrollment>(DOCUMENT_NAME, EnrollmentSchema);

export default EnrollmentModel;
