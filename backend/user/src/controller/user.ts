import type { Request, Response } from "express"
import { redisClient } from "../config/redis.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { User } from "../model/User.js";
import { createToken } from "../config/helper.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ message: "Please provide email" });

        if (!redisClient || !redisClient.isOpen)
            return res.status(500).json({ message: "Redis client not connected" });

        const ratelimitKey = `otp:ratelimit:${email}`;
        const ratelimit = await redisClient.get(ratelimitKey);
        if (ratelimit)
            return res.status(429).json({ message: "Too many request, Please wait before requestiong new otp" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const otpkey = `otp:${email}`;
        await redisClient.set(otpkey, otp, { EX: 300 });

        await redisClient.set(ratelimitKey, "true", { EX: 60 });
        const message = {
            to: email,
            subject: "Your Otp Code",
            body: `Your otp is ${otp}. it is valid for 5 min`,
        };

        await publishToQueue("send-otp", message);
        return res.status(200).json({ message: 'Otp Send to your mail' });
    } catch (error) {
        return res.status(500).json({ message: `Failed to login user: ${error}` });
    }
}

export const verifyuser = async (req: Request, res: Response) => {
    try {
        const { email, otp: enteredOtp } = req.body;
        if (!email || !enteredOtp)
            return res.status(400).json({ message: "Please provide email and otp are required." });

        if (!redisClient || !redisClient.isOpen)
            return res.status(500).json({ message: "Redis client not connected" });

        const otpkey = `otp:${email}`;
        const savedOtp = await redisClient.get(otpkey);
        if (!savedOtp || savedOtp !== enteredOtp)
            return res.status(400).json({ message: "Invalid or expired Otp" });

        await redisClient.del(otpkey);
        let user;
        user = await User.findOne({ email });
        if (!user) {
            user = new User({ email, name: email.split("@")[0] });
            await user.save();
        }
        const token = createToken({ id: user?._id, email });
        if (!token)
            return res.status(500).json({ message: "Failed to create token" });
        res.header("Authorization", `Bearer ${token}`);

        return res.status(200).json({ message: "User verified successfully", user, token });

    } catch (error) {
        return res.status(500).json({ message: `Failed to verify user: ${error}` });
    }
}

export async function myProfile(req: AuthenticatedRequest, res: Response) {
    try {
        const { userId } = req.user as any;
        if (!userId)
            return res.status(400).json({ message: "User id is missing in request" });

        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: `Failed to fetch profile: ${error}` });
    }
}

export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { userId } = req.user as any;
        const { name } = req.body;
        if (!userId)
            return res.status(400).json({ message: "User id is missing in request" });
        if (!name)
            return res.status(400).json({ message: "Name is required" });

        const user = await User.findOneAndUpdate({ _id: userId }, { name }, { new: true });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ message: "Name updated successfully", user });
    } catch (error) {
        return res.status(500).json({ message: `Failed to update name: ${error}` });
    }
}

export const getUsers = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(id);
        let user;
        if (id) {
            user = await User.findById(id);
            if (!user)
                return res.status(404).json({ message: "User not found" });
        } else {
            user = await User.find();
        }

        return res.status(200).json({message: "User fetch Successfully", user });

    } catch (error) {
        return res.status(500).json({ message: `Failed to fetch users: ${error}` });
    }
}