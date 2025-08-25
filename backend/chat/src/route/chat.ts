import express from 'express';
import { isAuth } from '../millerwares/isAuth.js';
import { createNewChat, getAllChats, getMessagesByChat, sendMessage } from '../controllers/chat.js';
import { upload } from '../millerwares/multer.js';

const route = express.Router();

route.post('/createNewChat', isAuth, createNewChat);
route.get('/fetchChat/all', isAuth, getAllChats);
route.post('/message', isAuth, upload.single('image'), sendMessage);
route.get('/messages/:chatId', isAuth, getMessagesByChat);

export default route;