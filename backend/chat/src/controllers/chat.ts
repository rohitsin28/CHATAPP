import type { Response } from "express";
import type { AuthenticatedRequest } from "../millerwares/isAuth.js";
import { Chat } from "../models/chatModel.js";
import { Message } from "../models/messages.js";
import axios from "axios";

export const createNewChat = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.user as any;
        const { otherUserId } = req.body;
        if (!otherUserId) return res.status(400).json({ message: 'Please provide otherUserId' });

        const isExistingChat = await Chat.findOne({
            users: { $all: [userId, otherUserId], $size: 2 }
        });

        if (isExistingChat) return res.status(200).json({ message: 'Chat already exists' });
        const newChat = await Chat.create({
            users: [userId, otherUserId]
        });
        return res.status(201).json({ message: 'New chat created', chat: newChat });
    } catch (error) {
        return res.status(500).json({ message: `Failed to create chat: ${error}` });
    };
}

export const getAllChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user as any;

    if (!userId)
      return res.status(400).json({ message: "User not authenticated" });

    const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });

    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const otherUserId = chat.users.find((id) => id.toString() !== userId);
        
        const unSeenCount = await Message.countDocuments({
          chatId: chat._id,
          isSeen: false,
          senderId: { $ne: userId },
        });
        
        try {
          const {data}  = await axios.get(
            `${process.env.USER_SERVICE_URL}/api/v1/user/getUser/${otherUserId}`,
            {
              headers: {
                Authorization: req.headers.authorization || "",
              },
            }
          );
          console.log("Fetched user data for chat:", data);
          return {
            user: data,
            chat: {
              ...chat.toObject(),
              lastMessage: chat.lastMessage || {},
              unSeenCount,
            },
          };
        } catch (error) {
          console.log("Failed to fetch user data for chat11");

          return {
            user: {
              _id: otherUserId,
              name: "Unknown User",
              email: "Unknown",
            },
            chat: {
              ...chat.toObject(),
              lastMessage: chat.lastMessage || {},
              unSeenCount,
            },
          };
        }
      })
    );

    return res.status(200).json({
      message: "Chats fetched successfully",
      chatWithUserData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Failed to get chats: ${(error as Error).message}` });
  }
};