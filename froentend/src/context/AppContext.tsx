"use client"

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import toast, { Toaster } from 'react-hot-toast';
import axios from "axios";

export const user_service = `http://192.168.1.39:5000/api/v1`;
export const chat_service = `http://192.168.1.39:5002/api/v1`;

export interface IUser {
    _id: string;
    name: string;
    email: string;
};

export interface IChat {
    _id: string;
    users: string[];
    latestMessage: {
        text: string;
        sender: string;
    };
    createdAt: string;
    updatedAt: string;
    unseenCount?: number;
}

export interface ICharts {
    _id: string;
    user: string;
    chat: IChat;
};

export interface AppContextType {
    user: IUser | null;
    loading: boolean;
    isAuth: boolean;
    setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: React.ReactNode;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    async function fetchuse() {
        try {
            const token = Cookies.get('token');
            const { data } = await fetch(`${user_service}/user/profile`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            }) as any;
            setUser(data);
            setIsAuth(true);
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }

    async function logoutUser() {
        Cookies.remove('token');
        setUser(null);
        setIsAuth(false);
        toast.success('User Logout Successfully');
    }

    const [chats, setChats] = useState<ICharts[] | null>(null);
    async function fetchChats() {
        const token = Cookies.get('token');
        try {
            const { data } = await axios.get(`${chat_service}/chat/fetchChat/all`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log("================>>>>>>",data);
            setChats(data.chats)
        } catch (error) {

        }
    }

    useEffect(() => {
        fetchuse();
        fetchChats();
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, loading, isAuth, setIsAuth }}>
            {children}
            <Toaster />
        </AppContext.Provider>
    );
};

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppData must be used within an AppProvider");
    }
    return context;
}