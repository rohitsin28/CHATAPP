import express from "express";
import { loginUser, verifyuser, myProfile, getUsers, updateUser } from "../controller/user.js";
import { isAuth } from "../middleware/isAuth.js";

const route = express.Router();

route.post("/login", loginUser);
route.post("/verifyUser", verifyuser);
route.patch("/getuser", isAuth, updateUser);
route.get("/profile", isAuth, myProfile)
route.get("/getuser", isAuth, getUsers);
route.get("/getuser/:id",isAuth, getUsers);

export default route;