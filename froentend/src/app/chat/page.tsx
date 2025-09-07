"use client";
import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, IUser, useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { SocketData } from "@/context/SocketContext";

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();
  const { onlineUsers, socket } = SocketData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [siderbarOpen, setSiderbarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [loading, router, isAuth]);

  const handleLogout = () => logoutUser();

  async function fetchChat() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.get(
        `${chat_service}/chat/messages/${selectedUser}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(data.messages);
      setUser(data.user.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load message");
    }
  }

  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    updatedUnseenCount = true
  ) => {
    setChats((prev) => {
      if (!prev) return null;

      const updatedChats = [...prev];
      const chatIndex = updatedChats.findIndex(
        (chat) => chat.chat._id === chatId
      );
      if (chatIndex !== -1) {
        const [moveChat] = updatedChats.splice(chatIndex, 1);
        const updatedChat = {
          ...moveChat,
          chat: {
            ...moveChat.chat,
            latestMessage: {
              text: newMessage.text,
              sender: newMessage.senderId,
            },
            updatedAt: new Date().toString(),

            unSeenCount:
              updatedUnseenCount && newMessage.senderId !== loggedInUser?._id
                ? (moveChat.chat.unseenCount || 0) + 1
                : moveChat.chat.unseenCount || 0,
          },
        };
        updatedChats.unshift(updatedChat);
      }
      return updatedChats;
    });
  };

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;

      return prev.map((chat) => {
        if (chat.chat._id === chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0,
            },
          };
        }
        return chat;
      });
    });
  };

  async function createChat(u: IUser) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/chat/createNewChat`,
        { userId: loggedInUser?._id, otherUserId: u._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;

    // SocketWork
    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }
    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    });

    const token = Cookies.get("token");
    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser);
      if (message.trim()) {
        formData.append("text", message);
      }

      if (imageFile) {
        formData.append("image", imageFile);
      }
      const { data } = await axios.post(
        `${chat_service}/chat/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) => {
        const currentMessages = prev || [];
        const messagesExist = currentMessages.some(
          (msg) => msg._id === data.message._id
        );

        if (!messagesExist) {
          return [...currentMessages, data.message];
        }

        return currentMessages;
      });
      setMessage("");
      const displayText = imageFile ? "📸 image" : message;
      moveChatToTop(selectedUser!,{
        text: displayText,
        senderId : data.data.senderId
      }, false);
      console.log('==================>>>',displayText,data)
    } catch (error: any) {
      toast.error(error.response.data.message);
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!selectedUser || !socket) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }, 2000);
    setTypingTimeOut(timeout);
  };

  useEffect(() => {
    socket?.on("userTyping", (data) => {
      socket.on('newMessage',(message)=>{
        console.log('=========recived new message=======',message);

        if(selectedUser === message.chatId){
          setMessages((prev)=>{
            const currentMessages = prev || [];
            const messageExists = currentMessages.some((msg)=> msg._id === message._id);
            if(!messageExists){
              return [...currentMessages,message]
            }
            return currentMessages;
          });
          moveChatToTop(message.chatId, message, false);
        }else{
          moveChatToTop(message.chatId, message, true);
        }
      });

      socket?.on('messageSeen',(data)=>{
        console.log("message seen by :", data);
        if(selectedUser === data.chatId){
          setMessages((prev)=>{
            if(!prev) return null;
            return prev.map((msg)=>{
              if(msg.senderId === loggedInUser?._id && data.messageIds && data.messageIds.includes(msg._id)){
                return {
                  ...msg,
                  seen: true,
                  seenAt: new Date().toString()
                }
              }else if(msg.senderId === loggedInUser?._id && !data.messageIds){
                return {
                  ...msg,
                  seen: true,
                  seenAt: new Date().toString()
                };
              }
              return msg;
            })
          })
        }
      })


      console.log("=========recieved user typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true);
      }
    });
    socket?.on("stopTyping", (data) => {
      console.log("=========recieved user Stopedtyping", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false);
      }
    });
    return () => {
      socket?.off('messageSeen');
      socket?.off('newMessage');
      socket?.off("userTyping");
      socket?.off("stopTyping");
    };
  }, [socket, selectedUser, loggedInUser?._id, setChats]);

  useEffect(() => {
    if (selectedUser) {
      fetchChat();
      setIsTyping(false);
      resetUnseenCount(selectedUser);

      socket?.emit("joinChat", selectedUser);
      return () => {
        socket?.emit("leaveChat", selectedUser);
        setMessages(null);
      };
    }
  }, [selectedUser, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeOut) {
        clearTimeout(typingTimeOut);
      }
    };
  }, [typingTimeOut]);

  if (loading) return <Loading />;
  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative">
      <ChatSidebar
        sidebarOpen={siderbarOpen}
        setSidebarOpen={setSiderbarOpen}
        showAllUsers={showAllUser}
        setShowAllUsers={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSiderbarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />

        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />

        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default ChatApp;
