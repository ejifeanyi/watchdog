// app.ts - Express application setup
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import watchlistRoutes from "./routes/watchlist";
import alertsRoutes from "./routes/alerts";
import stocksRoutes from "./routes/stocks";
import aiRoutes from "./routes/ai";
import { PrismaClient } from "@prisma/client";
import newsRoutes from "./routes/news";
import "./services/polygonService";

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
app.get("/", (req: Request, res: Response) => {
	res.json({ message: "Welcome to the Fintech API!" });
});

// Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: "Something went wrong!" });
});

export { app, prisma };
