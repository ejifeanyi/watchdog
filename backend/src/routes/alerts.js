import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// Add alert
router.post("/add", authenticate, async (req, res) => {
	const { symbol, targetPrice } = req.body;
	const userId = req.user?.userId;

	if (!userId) {
		return res.status(401).json({ error: "User ID is required" });
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
		console.error("Failed to add alert:", error);
		res.status(500).json({ error: "Failed to add alert" });
	}
});

// Get all alerts for the user
router.get("/", authenticate, async (req, res) => {
	const userId = req.user?.userId;

	if (!userId) {
		return res.status(401).json({ error: "User ID is required" });
	}

	try {
		const alerts = await prisma.alert.findMany({ where: { userId } });
		res.json(alerts);
	} catch (error) {
		console.error("Failed to fetch alerts:", error);
		res.status(500).json({ error: "Failed to fetch alerts" });
	}
});

// Delete alert
router.delete("/:id", authenticate, async (req, res) => {
	const { id } = req.params;
	const userId = req.user?.userId;

	if (!userId) {
		return res.status(401).json({ error: "User ID is required" });
	}

	try {
		await prisma.alert.deleteMany({
			where: {
				id,
				userId,
			},
		});
		res.json({ message: "Alert removed" });
	} catch (error) {
		console.error("Failed to delete alert:", error);
		res.status(500).json({ error: "Failed to delete alert" });
	}
});

export default router;
