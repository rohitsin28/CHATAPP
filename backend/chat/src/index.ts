import express from 'express'
import dotenv from 'dotenv'
import { expressConfig } from './config/express.js';
import { dbConnect } from './config/db.js';
import cors  from 'cors';

dotenv.config();
const PORT = process.env.PORT || 5002;

const app = express();
app.use(cors())
expressConfig(app);


app.listen(PORT, async () => {
    await dbConnect();
    console.log(`Chat service running on port ${PORT}`);
});