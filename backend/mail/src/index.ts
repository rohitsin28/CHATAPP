import express from "express";
import dotenv from "dotenv"
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config();
startSendOtpConsumer();

const app = express();
const PORT = process.env.PORT;

app.listen(PORT, async () => {
    console.log(`Server is runing on port ${PORT}`);
})