"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";

export const user_service = `http://192.168.1.39:5000/api/v1`;
export const chat_service = `http://192.168.1.39:5002/api/v1`;

// -------- Types -------- //
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
}

export interface AppContextType {
    user: IUser | null;
    loading: boolean;
    isAuth: boolean;
    setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
    logoutUser: () => Promise<void>;
    fetchChats: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    chats: ICharts[] | null;
    users: IUser[] | null;
    setChats: React.Dispatch<React.SetStateAction<ICharts[] | null>>;
}

// -------- Context Setup -------- //
const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [isAuth, setIsAuth] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [chats, setChats] = useState<ICharts[] | null>(null);
    const [users, setUsers] = useState<IUser[] | null>(null);

    // ✅ Fetch logged-in user
    async function fetchUser() {
        try {
            const token = Cookies.get("token");
            if (!token) {
                setLoading(false);
                return;
            }
            const { data } = await axios.get(`${user_service}/user/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(data);
            setIsAuth(true);
        } catch (error) {
            console.log(error);
            setUser(null);
            setIsAuth(false);
        } finally {
            setLoading(false);
        }
    }

    async function logoutUser() {
        Cookies.remove("token");
        setUser(null);
        setIsAuth(false);
        toast.success("User Logged Out Successfully");
    }

    async function fetchChats() {
        const token = Cookies.get("token");
        if (!token) return;
        try {
            const { data } = await axios.get(`${chat_service}/chat/fetchChat/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setChats(data.chatWithUserData);
        } catch (error) {
            console.log(error);
        }
    }

    async function fetchUsers() {
        const token = Cookies.get("token");
        if (!token) return;
        try {
            const { data } = await axios.get(`${user_service}/user/getUser`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUsers(data.user);
        } catch (error) {
            console.log(error);
        }
    }

    // Initial Load
    useEffect(() => {
        fetchUser();
        fetchChats();
        fetchUsers();
    }, []);

    return (
        <AppContext.Provider
            value={{
                user,
                setUser,
                loading,
                isAuth,
                setIsAuth,
                logoutUser,
                fetchChats,
                fetchUsers,
                chats,
                users,
                setChats
            }}
        >
            {children}
            <Toaster />
        </AppContext.Provider>
    );
};

// -------- Hook -------- //
export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppData must be used within an AppProvider");
    }
    return context;
}