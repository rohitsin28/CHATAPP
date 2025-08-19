import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export const redisConnect = async () => {
    if (redisClient) return redisClient;

    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not defined in environment variables");

    try {
        redisClient = createClient({ url });
        await redisClient.connect();
        console.log("================== Connected to Redis=====================");
        return redisClient;
    } catch (error) {
        console.error("Redis Connection error:", error);
        throw error;
    }
};
