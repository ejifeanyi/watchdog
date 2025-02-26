import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

interface AuthRequestBody {
	email: string;
	password: string;
}

// Signup
router.post(
	"/signup",
	async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
		const { email, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);

		try {
			const user = await prisma.user.create({
				data: { email, password: hashedPassword },
			});
			res.json({ message: "User created!", userId: user.id });
		} catch (error) {
			res.status(500).json({ error: "User creation failed" });
		}
	}
);

// Login
router.post(
	"/login",
	async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
		const { email, password } = req.body;
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			res.status(401).json({ error: "Invalid credentials" });
			return;
		}

		const token = jwt.sign({ userId: user.id }, "secret", { expiresIn: "7d" });
		res.json({ token });
	}
);

export default router;
