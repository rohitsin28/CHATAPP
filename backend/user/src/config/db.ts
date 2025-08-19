import mongoose from "mongoose";

export const dbConnect = async() => {
    const url = process.env.MONGO_URI;
    if(!url) throw new Error("MONGO_URI is not defined in env variable")
    try {
        await mongoose.connect(url,{dbName: "Chat_Microservice_App"});
        console.log("================== Connected to mongoDB=====================");
    } catch (error) {
        console.error("Failed to connect to mongodb",error);
        process.exit(1);
    }
};