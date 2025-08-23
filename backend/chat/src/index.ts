import express from 'express'
import dotenv from 'dotenv'
import { expressConfig } from './config/express.js';
import { dbConnect } from './config/db.js';

dotenv.config();
const PORT = process.env.PORT || 5002;

const app = express();
expressConfig(app);


app.listen(PORT, async () => {
    await dbConnect();
    console.log(`Chat service running on port ${PORT}`);
});