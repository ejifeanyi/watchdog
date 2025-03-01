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
	return jwt.sign(
		{ userId: user.id, email: user.email, name: user.name },
		JWT_SECRET,
		{ expiresIn: "24h" }
	);
};

// Signup route - modified to match frontend expectations
router.post("/signup", async (req, res) => {
	try {
		console.log("Signup request received with body:", JSON.stringify(req.body));

		const { name, email, password } = req.body;

		// Enhanced validation logging
		if (!name) console.log("Name is missing from request");
		if (!email) console.log("Email is missing from request");
		if (!password) console.log("Password is missing from request");

		if (!name || !email || !password) {
			return res.status(400).json({ error: "All fields are required" });
		}

		console.log("Checking if user already exists...");
		try {
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				console.log("User with email already exists:", email);
				return res.status(400).json({ error: "Email already in use" });
			}
		} catch (dbError) {
			console.error("Database error when checking existing user:", dbError);
			return res
				.status(500)
				.json({ error: "Database error", details: dbError.message });
		}

		console.log("Hashing password...");
		const hashedPassword = await bcrypt.hash(password, 10);

		console.log("Creating new user with name:", name, "and email:", email);
		try {
			const user = await prisma.user.create({
				data: {
					name,
					email,
					password: hashedPassword,
				},
			});

			console.log("User created successfully with ID:", user.id);

			// Generate token - exactly what frontend expects
			const token = generateToken(user);
			return res.status(200).json({ token });
		} catch (dbError) {
			console.error("Database error when creating user:", dbError);
			return res.status(500).json({
				error: "Database error",
				details: dbError.message,
				stack: dbError.stack,
			});
		}
	} catch (error) {
		console.error("Signup error:", error);
		return res.status(500).json({
			error: "Internal server error",
			details: error.message,
			stack: error.stack,
		});
	}
});

// Login route - modified to match frontend expectations
router.post("/login", async (req, res) => {
	try {
		console.log("Login request received with body:", JSON.stringify(req.body));

		const { email, password } = req.body;

		if (!email || !password) {
			console.log("Missing login credentials");
			return res.status(400).json({ error: "Email and password are required" });
		}

		console.log("Finding user with email:", email);
		try {
			const user = await prisma.user.findUnique({ where: { email } });
			if (!user) {
				console.log("User not found for email:", email);
				return res.status(401).json({ error: "Invalid credentials" });
			}

			console.log("User found, comparing passwords...");
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				console.log("Password does not match for user:", email);
				return res.status(401).json({ error: "Invalid credentials" });
			}

			console.log("Login successful for user ID:", user.id);
			// Generate token - exactly what frontend expects
			const token = generateToken(user);
			return res.status(200).json({ token });
		} catch (dbError) {
			console.error("Database error during login:", dbError);
			return res.status(500).json({
				error: "Database error",
				details: dbError.message,
				stack: dbError.stack,
			});
		}
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({
			error: "Internal server error",
			details: error.message,
			stack: error.stack,
		});
	}
});

export default router;
