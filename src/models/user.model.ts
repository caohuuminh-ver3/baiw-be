import mongoose from 'mongoose';

const DOCUMENT_NAME = 'User';
const COLLECTION_NAME = 'Users';

export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export interface IUser extends mongoose.Document {
    username: string;
    email: string;
    password: string;
    status: string;
    verify: boolean;
    roles: Role[];
}

const userSchema = new mongoose.Schema<IUser>(
    {
        username: {
            type: String,
            trim: true,
            maxLength: 150,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'inactive',
        },
        verify: {
            type: mongoose.Schema.Types.Boolean,
            default: false,
        },
        roles: { type: [String], default: [Role.USER] },
    },
    {
        timestamps: true,
        collection: COLLECTION_NAME,
    },
);

const UserModel = mongoose.model(DOCUMENT_NAME, userSchema);

export default UserModel;
