import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// Signup
interface AuthRequestBody {
	name?: string;
	email: string;
	password: string;
}

// ✅ Define router POST for Signup
router.post(
	"/signup",
	async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
		try {
			const { name, email, password } = req.body;

			if (!name || !email || !password) {
				res.status(400).json({ error: "All fields are required" });
				return;
			}

			// Check if user exists
			const existingUser = await prisma.user.findUnique({ where: { email } });
			if (existingUser) {
				res.status(400).json({ error: "Email already in use" });
				return;
			}

			// Hash password and create user
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = await prisma.user.create({
				data: { name, email, password: hashedPassword },
			});

			// Generate JWT token
			const token = jwt.sign(
				{ id: user.id, email: user.email, name: user.name },
				"secret",
				{
					expiresIn: "15d",
				}
			);

			res.json({ token });
		} catch (error) {
			console.error("Signup error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
),
	// Login
	router.post(
		"/login",
		async (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
			try {
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

				const token = jwt.sign({ userId: user.id }, "secret", {
					expiresIn: "7d",
				});
				res.json({ token });
			} catch (error) {
				console.error("Login error:", error);
				res.status(500).json({ error: "Internal server error" });
			}
		}
	);

export default router;
