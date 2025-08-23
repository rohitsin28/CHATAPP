import express, { type Request, type Response, type Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import UserRoute from "../routes/User.js";
import cors from "cors";

export const expressConfig = (app: Application) => {
    app.use(cors());
    app.use(helmet());
    app.use(morgan("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"));
    
    app.get("/test", (req: Request, res: Response) => {
        res.send("Welcome to User Service");
    });
    
    app.use("/api/v1/user", UserRoute);
    
    app.use((req: Request, res: Response) => {
        res.status(404).json({ message: "Route not found" });
    });
}