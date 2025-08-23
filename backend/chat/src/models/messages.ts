import mongoose from "mongoose";

export interface IMessage extends Document {
    chatId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    text?: string;
    image?: {
        url: string;
        publicId: string;
    }
    messageType: 'text' | 'image';
    isSeen: boolean;
    seenAt?: Date;
    createdAt: Date;
    updatedAt: Date;
};

const messageSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    image: {
        url: { type: String },
        publicId: { type: String }
    },
    messageType: { type: String, enum: ['text', 'image'], default: 'text' },
    isSeen: { type: Boolean, default: false },
    seenAt: { type: Date }
}, { timestamps: true, versionKey: false });

export const Message = mongoose.model<IMessage>('Message', messageSchema);