"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
// app.ts - Express application setup
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const watchlist_1 = __importDefault(require("./routes/watchlist"));
const alerts_1 = __importDefault(require("./routes/alerts"));
const stocks_1 = __importDefault(require("./routes/stocks"));
const ai_1 = __importDefault(require("./routes/ai"));
const client_1 = require("@prisma/client");
const news_1 = __importDefault(require("./routes/news"));
require("./services/polygonService");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
// Routes
app.use("/api/auth", auth_1.default);
app.use("/api/stocks", stocks_1.default);
app.use("/api/watchlist", watchlist_1.default);
app.use("/api/alerts", alerts_1.default);
// AI Routes
app.use("/api/ai", ai_1.default);
app.use("/api/news", news_1.default);
// Health Check
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the Fintech API!" });
});
// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
