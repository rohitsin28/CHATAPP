import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../config/helper.js";

export interface IUser extends Document {
    id: string;
    name: string;
    email: string;
};

export interface AuthenticatedRequest extends Request {
    user?: IUser | null;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer '))
            return res.status(401).json({ message: 'Please login - No Auth Header' });

        const token = authHeader.split(' ')[1];
        if (!token)
            return res.status(401).json({ message: 'Unauthorized' });

        const decoded = await verifyToken(token) as IUser;

        req.user = {
            userId: decoded.id,
            email: decoded.email
        } as any;
        
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}