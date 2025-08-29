'use client'
import React, { useEffect, useRef, useState } from 'react'
import { LoaderPinwheel, Lock, MoveRight } from 'lucide-react';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
import { useAppData, user_service } from '@/context/AppContext';
import Loading from './Loading';
import toast from 'react-hot-toast';

const VerifyOtp = () => {
    const { isAuth,setUser, setIsAuth, loading: userloading } = useAppData();

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [showLoader, setShowLoader] = useState<boolean>(false);
    const [resendLoading, setResendLoading] = useState<boolean>(false);
    const [timer, setTimer] = useState<number>(60);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        if (timer > 0) {
            const countdown = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(countdown);
        }
    }, [timer]);

    const handleInputChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
        if (digits.length === 6) {
            setOtp(digits);
            inputRefs.current[5]?.focus();
        }
    }

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> => {
        e.preventDefault();

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);

        // Show loader after slight delay
        setTimeout(() => {
            setShowLoader(true);
        }, 300);

        try {
            // Simulate API call - replace with your actual API
            const response = await fetch(`${user_service}/user/verifyUser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email, otp: otpString })
            });

            const data = await response.json();

            if (response.ok) {
                // Set cookie (in real app, use proper cookie library)
                document.cookie = `token=${data.token}; expires=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()}; path=/`;

                toast.error(data.message || 'OTP Verified Successfully!');
            } else {
                setError(data.message || 'Invalid OTP. Please try again.');
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
            setShowLoader(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError(''); // Clear any existing errors

        try {
            // Simulate resend API call - replace with your actual API
            const response = await fetch(`${user_service}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'New OTP sent to your email!');
                setTimer(60); // Reset timer
                setOtp(['', '', '', '', '', '']); // Clear OTP inputs
                inputRefs.current[0]?.focus(); // Focus first input
                setUser(data.user);
                setIsAuth(true);
            } else {
                toast.error(data.message || 'Failed to resend OTP. Please try again.');
            }
        } catch (error: any) {
            console.error('Resend error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if(userloading) return <Loading/>
    if(isAuth) redirect('/chat');
    return (
        <div className="min-h-screen bg-blue-500 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="space-y-1 mb-6">
                    <div className="flex justify-center bg-blue-500 w-12 h-12 rounded-full mx-auto items-center">
                        <Lock className='text-white' size={20} />
                    </div>
                    <h1 className='font-bold text-2xl text-center'>Verify OTP</h1>
                    <h6 className='text-xs text-center text-gray-600'>We have sent a 6-digit code to</h6>
                    <p className='text-xs text-center text-blue-500 font-medium'>{email}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-4 text-center'>Enter your 6 digit OTP here</label>
                        <div className="flex justify-center space-x-3">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    name={`otp-${index}`}
                                    maxLength={1}
                                    value={data}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={index === 0 ? handlePaste : undefined}
                                    ref={(el: HTMLInputElement | null) => (inputRefs.current[index] = el)}
                                    className={`w-12 h-12 text-center border ${error ? 'border-red-500' : data ? 'border-blue-500' : 'border-gray-300'
                                        } rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg font-semibold transition-colors`}
                                    disabled={loading}
                                />
                            ))}
                        </div>
                        {error && <p className='text-sm mt-4 px-4 py-3 bg-red-500 text-white text-center rounded-lg'>{error}</p>}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || otp.join('').length !== 6}
                        className={`w-full text-center rounded-lg px-4 py-3 text-white font-semibold transition-colors duration-200 ${loading || otp.join('').length !== 6
                                ? 'bg-gray-400 cursor-not-allowed flex justify-center items-center gap-2'
                                : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                            }`}
                    >
                        Verify OTP
                        <MoveRight className={`ml-3 ${showLoader ? 'hidden' : 'inline-block'}`} size={20} />
                        <LoaderPinwheel className={`animate-spin ${showLoader ? 'inline-block' : 'hidden'}`} size={20} />
                    </button>

                    <div className="text-center">
                        <p className='text-gray-700 text-sm mb-3'>Did't receive the code?</p>
                        {timer > 0 ? (
                            <p className="text-sm text-gray-600">
                                Resend OTP in{" "}
                                <span className="font-semibold text-blue-500">{formatTime(timer)}</span>
                            </p>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-sm text-blue-500 hover:text-blue-600 font-medium underline disabled:opacity-50"
                            >
                                {resendLoading ? "Sending..." : "Resend OTP"}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default VerifyOtp