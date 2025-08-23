import express, { type Request, type Response, type Application } from "express";
import cors from "cors";
import Chat from "../route/chat.js";

export const expressConfig = (app: Application) => {
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"));
    
    app.get("/chat", (req: Request, res: Response) => {
        res.send("Welcome to Chat Service");
    });
    
    app.use('/api/v1/chat', Chat);
    app.use((req: Request, res: Response) => {
        res.status(404).json({ message: "Route not found" });
    });
}