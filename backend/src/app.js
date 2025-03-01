import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import watchlistRoutes from "./routes/watchlist.js";
import alertsRoutes from "./routes/alerts.js";
import stocksRoutes from "./routes/stocks.js";
import aiRoutes from "./routes/ai.js";
import { PrismaClient } from "@prisma/client";
import newsRoutes from "./routes/news.js";
import "./services/polygonService.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stocksRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/alerts", alertsRoutes);

// AI Routes
app.use("/api/ai", aiRoutes);
app.use("/api/news", newsRoutes);

// Health Check
app.get("/", (req, res) => {
	res.json({ message: "Welcome to the Fintech API!" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

export { app, prisma };
