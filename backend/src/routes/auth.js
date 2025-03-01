import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// Secret keys for JWT (use environment variables in production)
const ACCESS_TOKEN_SECRET = "access_secret";
const REFRESH_TOKEN_SECRET = "refresh_secret";

// Helper function to generate tokens
const generateTokens = (user) => {
	const accessToken = jwt.sign(
		{ userId: user.id, email: user.email, name: user.name },
		ACCESS_TOKEN_SECRET,
		{ expiresIn: "15m" } // Short-lived access token
	);

	const refreshToken = jwt.sign(
		{ userId: user.id },
		REFRESH_TOKEN_SECRET,
		{ expiresIn: "7d" } // Long-lived refresh token
	);

	return { accessToken, refreshToken };
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

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user);

		// Save refresh token to the database
		await prisma.refreshToken.create({
			data: {
				token: refreshToken,
				userId: user.id,
			},
		});

		res.json({ accessToken, refreshToken });
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

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user);

		// Save refresh token to the database
		await prisma.refreshToken.create({
			data: {
				token: refreshToken,
				userId: user.id,
			},
		});

		res.json({ accessToken, refreshToken });
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Refresh token route
router.post("/refresh-token", async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			res.status(400).json({ error: "Refresh token is required" });
			return;
		}

		// Verify the refresh token
		const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
		const userId = decoded.userId;

		// Check if the refresh token exists in the database
		const storedToken = await prisma.refreshToken.findFirst({
			where: {
				token: refreshToken,
				userId,
			},
		});

		if (!storedToken) {
			res.status(401).json({ error: "Invalid refresh token" });
			return;
		}

		// Generate a new access token
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			res.status(401).json({ error: "User not found" });
			return;
		}

		const accessToken = jwt.sign(
			{ userId: user.id, email: user.email, name: user.name },
			ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" }
		);

		res.json({ accessToken });
	} catch (error) {
		console.error("Refresh token error:", error);
		res.status(401).json({ error: "Invalid refresh token" });
	}
});

// Logout route (optional: revoke refresh token)
router.post("/logout", async (req, res) => {
	try {
		const { refreshToken } = req.body;

		if (!refreshToken) {
			res.status(400).json({ error: "Refresh token is required" });
			return;
		}

		// Delete the refresh token from the database
		await prisma.refreshToken.deleteMany({
			where: {
				token: refreshToken,
			},
		});

		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
