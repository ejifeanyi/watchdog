import { createClient } from "redis";

const redis = createClient({
	username: "default",
	password: "GjrpdN8hzYlYK8oZoSEaNzZ9CjuzwKJ1",
	socket: {
		host: "redis-15871.c245.us-east-1-3.ec2.redns.redis-cloud.com",
		port: 15871,
	},
});

redis.on("error", (err) => console.log("Redis Client Error", err));

await redis.connect();

export default redis;
