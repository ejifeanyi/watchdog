// src/redis.js
import { createClient } from "redis";

const redisClient = createClient({
	url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
	socket: {
		reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
	},
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.on("connect", () => console.log("🔗 Redis connected"));
redisClient.on("ready", () => console.log("✅ Redis ready"));
redisClient.on("reconnecting", () => console.log("🔄 Redis reconnecting"));

// Connect to Redis
(async () => {
	try {
		await redisClient.connect();
	} catch (err) {
		console.error("Failed to connect to Redis:", err);
	}
})();

// Create wrapper with promisified methods to match your current usage
const redis = {
	get: async (key) => await redisClient.get(key),
	set: async (key, value, ...args) => {
		// Handle different calling patterns for set
		if (args.length === 2 && args[0] === "ex") {
			return await redisClient.set(key, value, { EX: args[1] });
		} else {
			const options = args[0] || {};
			return await redisClient.set(key, value, options);
		}
	},
	del: async (key) => await redisClient.del(key),
	// Add any other Redis commands you use
};

export default redis;
