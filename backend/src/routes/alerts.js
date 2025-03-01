import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

router.post("/add", authenticate, async () => {
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
});

router.get("/", authenticate, async (req, res) => {
	const userId = req.user?.userId;

	if (!userId) {
		res.status(401).json({ error: "User ID is required" });
		return;
	}

	const alerts = await prisma.alert.findMany({ where: { userId } });
	res.json(alerts);
});

router.delete("/:id", authenticate, async () => {
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
});

export default router;
