import dotenv from "dotenv";
import { createServer } from "http"; // Import createServer from http
import { app } from "./app"; // Your Express app
import { initWebSockets } from "./socket"; // Your WebSocket initialization function

dotenv.config();

const PORT = process.env.PORT || 5000;

// ✅ Create a single HTTP server instance
const server = createServer(app);

// ✅ Attach WebSockets to the same server instance
const io = initWebSockets(server);

// ✅ Start the server
server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Handle server errors
server.on("error", (error) => {
	console.error("❌ Server error:", error);
});

// Export the io instance if needed elsewhere
export { io };
