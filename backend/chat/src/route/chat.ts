import express from 'express';
import { isAuth } from '../millerwares/isAuth.js';
import { createNewChat, getAllChats } from '../controllers/chat.js';

const route = express.Router();

route.post('/createNewChat', isAuth, createNewChat);
route.get('/fetchChat/all', isAuth, getAllChats);

export default route;