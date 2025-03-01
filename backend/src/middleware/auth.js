import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// Use the same JWT secret as your middleware
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Helper function to generate token
const generateToken = (user) => {
	const token = jwt.sign(
		{ userId: user.id, email: user.email, name: user.name },
		JWT_SECRET,
		{ expiresIn: "24h" }
	);

	return token;
};

// Signup route
router.post("/signup", async (req, res) => {
	try {
		const { name, email, password } = req.body;

		if (!name || !email || !password) {
			res.status(400).json({ error: "All fields are required" });
			return;
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			res.status(400).json({ error: "Email already in use" });
			return;
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: { name, email, password: hashedPassword },
		});

		// Generate token without refresh token functionality
		const token = generateToken(user);

		res.json({ token });
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Login route
router.post("/login", async (req, res) => {
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

		// Generate token without refresh token
		const token = generateToken(user);

		res.json({ token });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
