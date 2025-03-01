import { Redis } from "@upstash/redis";

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// You can log connection success, but the REST client doesn't have events like ioredis
console.log("🔗 Redis client initialized");

export default redis;
