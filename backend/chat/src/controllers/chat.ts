import type { Response } from "express";
import type { AuthenticatedRequest } from "../millerwares/isAuth.js";
import { Chat } from "../models/chatModel.js";
import { Message } from "../models/messages.js";
import axios from "axios";
import { getRecieverSocketId, io } from "../config/socket.js";

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
          const { data } = await axios.get(
            `${process.env.USER_SERVICE_URL}/api/v1/user/getUser/${otherUserId}`,
            {
              headers: {
                Authorization: req.headers.authorization || "",
              },
            }
          );

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

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId: senderId } = req.user as any;
    const { chatId, text } = req.body;

    const imageFile = req.file;
    if (!senderId) return res.status(401).json({ message: 'You are not Autherized!' });
    if (!chatId) return res.status(400).json({ message: 'Chat Id is required!' });
    if (!text && !imageFile) return res.status(400).json({ message: 'Either message text or image is required!' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found!' });

    const isUserInChat = chat.users.some((userId) => userId.toString() === senderId.toString())
    if (!isUserInChat) return res.status(403).json({ message: 'You are not a participant of this chat!' });

    const otherUserId = chat.users.find((id) => id?.toString() !== senderId.toString()) as any;
    if (!otherUserId) return res.status(401).json({ message: 'Invalid chat participants!' });

    // Socket Setup
    const receiverSocketId = getRecieverSocketId(otherUserId.toString());
    let isReceiverInChatRoom = false;
    if(receiverSocketId){
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      if(receiverSocket && receiverSocket.rooms.has(chatId)){
        isReceiverInChatRoom = true;
      }
    }

    let messageData: any = {
      chatId,
      senderId,
      seen: isReceiverInChatRoom,
      seenAt: isReceiverInChatRoom ? new Date() : undefined
    };

    if (imageFile) {
      messageData.image = {
        url: imageFile.path,
        public_id: imageFile.filename
      };
      messageData.messageType = 'image';
      messageData.text = text || '';
    } else {
      messageData.messageType = 'text';
      messageData.text = text;
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();
    const latestMessageText = imageFile ? '📸 image' : text;
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: { text: latestMessageText, senderId },
      updatedAt: new Date()
    }, { new: true });

    // emit to socket
    io.to(chatId).emit('newMessage', savedMessage);
    if(receiverSocketId){
      io.to(receiverSocketId).emit('newMessage', savedMessage);
    }

    const senderSocketId = getRecieverSocketId(senderId.toString());
    if(senderSocketId) {
      io.to(senderSocketId).emit('newMessage',savedMessage);
    }

    if(isReceiverInChatRoom && senderSocketId){
      io.to(senderSocketId).emit('messagesSeen',{chatId,seenBy:otherUserId,messageIds: [savedMessage._id]});
    }

    return res.status(201).json({ message: 'Message sent successfully', data: savedMessage });
  } catch (error) {
    return res.status(500).json({ message: `Failed to send message: ${error}` });
  }
}

export const getMessagesByChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { chatId } = req.params;
    if (!userId) return res.status(401).json({ message: 'You are not Autherized!' });
    if (!chatId) return res.status(400).json({ message: 'Chat Id is required!' });
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found!' });
    const isUserInChat = chat.users.some((id) => id.toString() === userId.toString());
    if (!isUserInChat) return res.status(403).json({ message: 'You are not a participant of this chat!' });

    const messagesToMarkSeen = await Message.find({ chatId, senderId: {$ne: userId}, isSeen: false }).sort({ createdAt: 1 });
    await Message.updateMany({ chatId, senderId: {$ne: userId}, isSeen: false }, { isSeen: true, seenAt: new Date() });

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    const otherUserId = chat.users.find((id) => id?.toString() !== userId.toString()) as any;
    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/v1/user/getUser/${otherUserId}`,
        {
          headers: {
            Authorization: req.headers.authorization || "",
          },
        }
      );
      if(!otherUserId)
        return res.status(400).json({ message: 'No Other user!' });
      
      // Socket Work
      if(messagesToMarkSeen.length > 0){
        const otherSocketId = getRecieverSocketId(otherUserId.toString());
        if(otherSocketId){
          io.to(otherSocketId).emit('messagesSeen',{
            chatId,seenBy: userId, messageIds: messagesToMarkSeen.map((msg)=>msg._id)
          })
        }
      }

      return res.json({ message: 'Messages fetched successfully', messages, user: data, markedAsSeen: messagesToMarkSeen.length });
    } catch (error) {
      return res.json({ message: 'Messages fetched successfully', messages, user: {_id: otherUserId, name: 'Unknown User'}});
    }

  } catch (error) {
    return res.status(500).json({ message: `Failed to get messages: ${error}` });
  }
};