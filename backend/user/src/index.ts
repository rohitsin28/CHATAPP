import express from "express";
import { dbConnect } from "./config/db.js";
import dotenv from "dotenv";
import { redisConnect } from "./config/redis.js";
import { expressConfig } from "./config/express.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config()
const app = express();
const PORT = process.env.PORT || 5000;
expressConfig(app);

app.listen(PORT, async () => {
    console.log(`Server is runing on port ${PORT}`);
    await redisConnect();
    await connectRabbitMQ();
    await dbConnect();
})