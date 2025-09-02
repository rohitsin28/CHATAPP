'use client';
import ChatSidebar from '@/components/ChatSidebar';
import Loading from '@/components/Loading';
import { chat_service, IUser, useAppData } from '@/context/AppContext'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast';
import Cookies from 'js-cookie'
import axios from 'axios';
import ChatHeader from '@/components/ChatHeader';

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
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
  const { loading, isAuth, logoutUser, chats, user: loggedInUser, users, fetchChats, setChats } = useAppData();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [siderbarOpen, setSiderbarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [showAllUser, setShowAllUser] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(null);


  const router = useRouter();
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push('/login');
    }
  }, [loading, router, isAuth]);

  const handleLogout = () => logoutUser();

  async function fetchChat() {
    const token = Cookies.get('token');
    try {
      const {data} = await axios.get(`${chat_service}/chat/messages/${selectedUser}`,{
        headers:{
          Authorization: `Bearer ${token}`
        }
      });
      setMessages(data.messages);
      setUser(data.user.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load message");
    }
  }

  async function createChat(u: IUser){
    try {
      const token = Cookies.get('token');
      const {data } = await axios.post(`${chat_service}/chat/createNewChat`,{userId: loggedInUser?._id, otherUserId: u._id},{
        headers:{
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUser(data.chatId);
      setShowAllUser(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  useEffect(()=>{
    if(selectedUser){
      fetchChat();
    }
  },[selectedUser]);

  if (loading) return <Loading />
  return (
    <div className='min-h-screen flex bg-gray-900 text-white relative'>
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
        createChat = {createChat} />

        <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
          <ChatHeader user={user} setSidebarOpen={setSiderbarOpen} isTyping={isTyping}/>
        </div>
    </div>
  )
}

export default ChatApp