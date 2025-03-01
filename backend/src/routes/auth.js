import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// Secret key for JWT (use environment variables in production)
const ACCESS_TOKEN_SECRET = "access_secret";

// Helper function to generate token
const generateToken = (user) => {
	const accessToken = jwt.sign(
		{ userId: user.id, email: user.email, name: user.name },
		ACCESS_TOKEN_SECRET,
		{ expiresIn: "24h" } // Longer-lived access token since we're not using refresh tokens
	);

	return { accessToken };
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

		// Generate token
		const { accessToken } = generateToken(user);

		res.json({ accessToken });
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

		// Generate token
		const { accessToken } = generateToken(user);

		res.json({ accessToken });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Simple middleware for protected routes
export const authenticateToken = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (!token) {
		return res.status(401).json({ error: "Authentication required" });
	}

	jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
		if (err) {
			return res.status(403).json({ error: "Invalid or expired token" });
		}
		req.user = user;
		next();
	});
};

export default router;
