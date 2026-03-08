import mongoose, { Document, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'SavedCourse';
export const COLLECTION_NAME = 'SavedCourses';

export interface ISavedCourse extends Document {
    user_id: mongoose.Types.ObjectId;
    course_id: mongoose.Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

const SavedCourseSchema = new Schema<ISavedCourse>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        course_id: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
);

// Ensure a user can only save a course once
SavedCourseSchema.index({ user_id: 1, course_id: 1 }, { unique: true });

// Index for efficient queries
SavedCourseSchema.index({ user_id: 1, createdAt: -1 });

const SavedCourseModel = mongoose.model<ISavedCourse>(DOCUMENT_NAME, SavedCourseSchema);

export default SavedCourseModel;
