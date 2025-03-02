import dotenv from "dotenv";
import { createServer } from "http";
import { initWebSockets } from "./socket.js";
import { app } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 10000;

const server = createServer(app);

const io = initWebSockets(server);

server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});

server.on("error", (error) => {
	console.error("❌ Server error:", error);
});

export { io };
