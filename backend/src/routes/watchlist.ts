// routes/watchlist.ts
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
	};
	params: {
		symbol?: string;
	};
}

// Add stock to watchlist
router.post(
	"/add",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (
		req: RequestWithUser & Request<{}, {}, WatchlistRequest>,
		res: Response
	): Promise<void> => {
		const { symbol } = req.body;
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
			const stock = await prisma.watchlist.create({
				data: { symbol, userId },
			});
			res.json(stock);
		} catch (error) {
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

		const watchlist = await prisma.watchlist.findMany({ where: { userId } });
		res.json(watchlist);
	}
);

// Remove stock from watchlist
router.delete(
	"/:symbol",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (req: WatchlistRequest, res: Response) => {
		const { symbol } = req.params;
		const userId = req.user?.userId;

		await prisma.watchlist.deleteMany({ where: { userId, symbol } });
		res.json({ message: "Stock removed" });
	}
);

export default router;
