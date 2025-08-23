import mongoose from "mongoose";

export interface IChat extends mongoose.Document {
    users: [string];
    lastMessage: {
        text: string;
        sender: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const schema = new mongoose.Schema({
    users: [{ type: String, required: true }],
    lastMessage: {
        text: { type: String },
        sender: { type: String }
    }
}, { timestamps: true, versionKey: false });

export const Chat = mongoose.model<IChat>('Chat', schema);