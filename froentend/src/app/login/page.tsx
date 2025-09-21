'use client'
import { user_service } from '@/context/AppContext';
import axios from 'axios';
import { Mail, LoaderPinwheel, MoveRight, Mails } from 'lucide-react'
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import toast from 'react-hot-toast';

const Login = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Record<string, string>>({ email: '' });
    const [formData, setFormData] = useState<Record<string, string>>({
        email: '',
    });

    const validateEmail = (email: string) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const router = useRouter();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        setError((prev) => {
            const updated = { ...prev };
            if (name === 'email') {
                updated.email = !value
                    ? "Email is required"
                    : !validateEmail(value)
                        ? "Email is invalid"
                        : "";
            }
            return updated;
        });
    };

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> => {
        e.preventDefault();

        if (!formData.email) {
            setError((prev) => ({ ...prev, email: "Email is required" }));
            return;
        }

        if (!validateEmail(formData.email)) {
            setError((prev) => ({ ...prev, email: "Email is invalid" }));
            return;
        }

        if (error.email) return;

        setLoading(true);
        try {
            const { data } = await axios.post(`${user_service}/user/login`, { email: formData.email });
            toast.success(data.message);
            router.push(`/verify?email=${formData.email}`);
        } catch (error: any) {
            if (error.response) {
                toast.error(error.response.data.message || "Something went wrong!");
            } else if (error.request) {
                toast.error("Server not responding. Please try again later.");
            } else {
                toast.error(error.message || "Something went wrong!");
            }
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="min-h-screen bg-blue-500 flex justify-center items-center">
            <div className="bg-white px-8 pt-5 pb-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="space-y-1 mb-4">
                    <div className="flex justify-center mx-auto h-12 w-12 rounded-full bg-blue-500 items-center mb-2">
                        <Mails size={30} className='text-white' />
                    </div>
                    <h1 className='font-bold text-2xl text-center'>Welcome to ChatApp</h1>
                    <h6 className='text-xs text-center'>Enter your email to continue your journey</h6>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Email Address</label>
                        <div className="relative">
                            <Mail size={20} className='absolute left-2.5 top-4 w-5 text-gray-400' />
                            <input
                                className='w-full border rounded-lg px-10 py-3 border-gray-500 focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none'
                                type="email"
                                value={formData.email}
                                name="email"
                                onChange={handleChange}
                                placeholder='Please enter your email'
                                disabled={loading}
                            />
                        </div>
                        {error.email && <p className='text-red-500 text-sm mt-1'>{error.email}</p>}
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full text-center rounded-lg px-4 py-3 text-white font-semibold transition-colors duration-200 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                Sending...
                                <LoaderPinwheel className="animate-spin" size={20} />
                            </>
                        ) : (
                            <>
                                Send Verification Code
                                <MoveRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Login