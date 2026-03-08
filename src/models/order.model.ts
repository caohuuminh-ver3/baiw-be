import { Document, model, Schema } from 'mongoose';

export const DOCUMENT_NAME = 'Order';
export const COLLECTION_NAME = 'Orders';

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface IOrder extends Document {
  user_id: Schema.Types.ObjectId;
  course_id: Schema.Types.ObjectId;
  amount: number;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    course_id: { type: Schema.Types.ObjectId, required: true, ref: 'Course' },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  },
);

OrderSchema.index({ user_id: 1, course_id: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const OrderModel = model<IOrder>(DOCUMENT_NAME, OrderSchema);

export default OrderModel;
