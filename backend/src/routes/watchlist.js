import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

router.post("/add", authenticate, async (req, res) => {
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
		const existingStock = await prisma.watchlist.findFirst({
			where: { symbol, userId },
		});

		if (existingStock) {
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
});

router.get("/", authenticate, async (req, res) => {
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
});

router.delete("/:symbol", authenticate, async (req, res) => {
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
});

router.put("/:symbol", authenticate, async (req, res) => {
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
			},
		});

		res.json(updatedStock);
	} catch (error) {
		console.error("Error updating stock in watchlist:", error);
		res.status(500).json({ error: "Failed to update stock" });
		return;
	}
});

export default router;
