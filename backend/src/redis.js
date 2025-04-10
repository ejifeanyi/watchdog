import { createClient } from "redis";

const redis = createClient({
	username: "default",
	password: "m3sWr8Ir4BmlTf5GhfsbSr5k5xbyvBN7",
	socket: {
		host: "redis-15871.c245.us-east-1-3.ec2.redns.redis-cloud.com",
		port: 15871,
	},
});

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

export default redis;
