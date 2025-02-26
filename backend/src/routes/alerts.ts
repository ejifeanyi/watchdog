import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const prisma = new PrismaClient();
const router = express.Router();

// Define types for request
interface RequestWithUser extends Request {
	user?: { userId: string };
}

interface AlertRequestBody {
	symbol: string;
	targetPrice: number;
}

// Add price alert
router.post(
	"/add",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (
		req: RequestWithUser & Request<{}, {}, AlertRequestBody>,
		res: Response
	): Promise<void> => {
		const { symbol, targetPrice } = req.body;
		const userId = req.user?.userId;

		if (!userId) {
			res.status(401).json({ error: "User ID is required" });
			return;
		}

		try {
			const alert = await prisma.alert.create({
				data: {
					symbol,
					targetPrice,
					userId,
				},
			});
			res.json(alert);
		} catch (error) {
			res.status(500).json({ error: "Failed to add alert" });
		}
	}
);

// Get user's alerts
router.get(
	"/",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (req: RequestWithUser, res: Response): Promise<void> => {
		const userId = req.user?.userId;

		if (!userId) {
			res.status(401).json({ error: "User ID is required" });
			return;
		}

		const alerts = await prisma.alert.findMany({ where: { userId } });
		res.json(alerts);
	}
);

// Remove alert
router.delete(
	"/:id",
	authenticate as (req: Request, res: Response, next: NextFunction) => void,
	async (
		req: RequestWithUser & Request<{ id: string }>,
		res: Response
	): Promise<void> => {
		const { id } = req.params;
		const userId = req.user?.userId;

		if (!userId) {
			res.status(401).json({ error: "User ID is required" });
			return;
		}

		await prisma.alert.deleteMany({
			where: {
				id,
				userId,
			},
		});
		res.json({ message: "Alert removed" });
	}
);

export default router;
