"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http"); // Import createServer from http
const app_1 = require("./app"); // Your Express app
const socket_1 = require("./socket"); // Your WebSocket initialization function
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
// ✅ Create a single HTTP server instance
const server = (0, http_1.createServer)(app_1.app);
// ✅ Attach WebSockets to the same server instance
const io = (0, socket_1.initWebSockets)(server);
exports.io = io;
// ✅ Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
// ✅ Handle server errors
server.on("error", (error) => {
    console.error("❌ Server error:", error);
});
