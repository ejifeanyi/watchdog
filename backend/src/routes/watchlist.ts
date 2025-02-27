import express, { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const prisma = new PrismaClient();
const router = express.Router();

// Define types for request
interface RequestWithUser extends Request {
	user?: { userId: string };
}

interface WatchlistRequest extends Request {
	user?: { userId: string };
	body: {
		symbol?: string;
		volume?: number;
		price?: number;
		change?: number;
		changePercent?: string;
	};
	params: {
		symbol?: string;
	};
}

// Add stock to watchlist
router.post(
	"/add",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (req: RequestWithUser, res: Response): Promise<void> => {
		const { symbol, volume, price, change, changePercent } = req.body;
		const userId = req.user?.userId;

		if (!symbol) {
			res.status(400).json({ error: "Symbol is required" });
			return;
		}

		if (!userId) {
			res.status(401).json({ error: "User not authenticated" });
			return;
		}

		try {
			// First check if the stock already exists in the user's watchlist
			const existingStock = await prisma.watchlist.findFirst({
				where: { symbol, userId },
			});

			if (existingStock) {
				// Update the existing stock
				const updatedStock = await prisma.watchlist.update({
					where: { id: existingStock.id },
					data: {
						volume,
						price,
						change,
						changePercent,
					},
				});
				res.json(updatedStock);
			} else {
				// Create a new stock entry
				const stock = await prisma.watchlist.create({
					data: {
						symbol,
						volume,
						price,
						change,
						changePercent,
						userId,
					},
				});
				res.json(stock);
			}
		} catch (error) {
			console.error("Error adding/updating stock to watchlist:", error);
			res.status(500).json({ error: "Failed to add stock" });
		}
	}
);

// Get user's watchlist
router.get(
	"/",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (req: WatchlistRequest, res: Response) => {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(401).json({ error: "User not authenticated" });
			return;
		}

		try {
			const watchlist = await prisma.watchlist.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
			res.json(watchlist);
		} catch (error) {
			console.error("Error fetching watchlist:", error);
			res.status(500).json({ error: "Failed to fetch watchlist" });
		}
	}
);

// Remove stock from watchlist
router.delete(
	"/:symbol",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (req: WatchlistRequest, res: Response) => {
		const { symbol } = req.params;
		const userId = req.user?.userId;

		if (!userId) {
			res.status(401).json({ error: "User not authenticated" });
			return;
		}

		try {
			await prisma.watchlist.deleteMany({ where: { userId, symbol } });
			res.json({ message: "Stock removed successfully" });
		} catch (error) {
			console.error("Error removing stock from watchlist:", error);
			res.status(500).json({ error: "Failed to remove stock" });
		}
	}
);

// Update stock in watchlist (for refreshing price data)
router.put(
	"/:symbol",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (req: WatchlistRequest, res: Response) => {
		const { symbol } = req.params;
		const { volume, price, change, changePercent } = req.body;
		const userId = req.user?.userId;

		if (!userId) {
			res.status(401).json({ error: "User not authenticated" });
			return;
		}

		try {
			const existingStock = await prisma.watchlist.findFirst({
				where: { symbol, userId },
			});

			if (!existingStock) {
				res.status(404).json({ error: "Stock not found in watchlist" });
				return;
			}

			const updatedStock = await prisma.watchlist.update({
				where: { id: existingStock.id },
				data: {
					volume,
					price,
					change,
					changePercent,
					// updatedAt is handled automatically by Prisma's @updatedAt
				},
			});

			res.json(updatedStock);
		} catch (error) {
			console.error("Error updating stock in watchlist:", error);
			res.status(500).json({ error: "Failed to update stock" });
		}
	}
);

export default router;
