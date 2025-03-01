import { createClient } from "redis";

const redis = createClient({
	username: "default",
	password: "m3sWr8Ir4BmlTf5GhfsbSr5k5xbyvBN7",
	socket: {
		host: "redis-18072.c62.us-east-1-4.ec2.redns.redis-cloud.com",
		port: 18072,
	},
});

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

// These test lines should probably be removed in production
// Commenting them out rather than removing to show the fix
// await redis.set("foo", "bar");
// const result = await redis.get("foo");
// console.log(result);

export default redis;
