import { createClient, RedisClientType } from "redis";

const redisUrl: string | undefined = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

export const redisClient: RedisClientType = createClient({
  url: redisUrl,
});

redisClient.on("error", (err: Error) => {
  console.error("❌ Redis error:", err);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (redisClient.isOpen) return;

    await redisClient.connect();
    console.log("✅ Redis connected");
  } catch (error) {
    console.error("🔥 Redis connection failed:", error);
    process.exit(1);
  }
};
