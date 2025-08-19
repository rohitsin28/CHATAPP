import express from "express";
import { dbConnect } from "./config/db.js";
import dotenv from "dotenv";
import UserRoute from "./routes/User.js";
import { redisConnect } from "./config/redis.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config()
const app = express();
const PORT = process.env.PORT || 5000;

app.use("/", UserRoute)

app.listen(PORT, async () => {
    console.log(`Server is runing on port ${PORT}`);
    await redisConnect();  
    await connectRabbitMQ();
    await dbConnect();
})