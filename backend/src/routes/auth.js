import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

const generateToken = (user) => {
	return jwt.sign(
		{ userId: user.id, email: user.email, name: user.name },
		JWT_SECRET,
		{ expiresIn: "24h" }
	);
};

router.post("/signup", async (req, res) => {
	try {
		console.log("Signup request received with body:", JSON.stringify(req.body));

		const { name, email, password } = req.body;

		if (!name) console.log("Name is missing from request");
		if (!email) console.log("Email is missing from request");
		if (!password) console.log("Password is missing from request");

		if (!name || !email || !password) {
			res.status(400).json({ error: "All fields are required" });
			return;
		}

		console.log("Checking if user already exists...");
		try {
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				console.log("User with email already exists:", email);
				res.status(400).json({ error: "Email already in use" });
				return;
			}
		} catch (dbError) {
			console.error("Database error when checking existing user:", dbError);
			res
				.status(500)
				.json({ error: "Database error", details: dbError.message });
			return;
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

			const token = generateToken(user);
			res.status(200).json({ token });
			return;
		} catch (dbError) {
			console.error("Database error when creating user:", dbError);
			res.status(500).json({
				error: "Database error",
				details: dbError.message,
				stack: dbError.stack,
			});
			return;
		}
	} catch (error) {
		console.error("Signup error:", error);
		res.status(500).json({
			error: "Internal server error",
			details: error.message,
			stack: error.stack,
		});
		return;
	}
});

router.post("/login", async (req, res) => {
	try {
		console.log("Login request received with body:", JSON.stringify(req.body));

		const { email, password } = req.body;

		if (!email || !password) {
			console.log("Missing login credentials");
			res.status(400).json({ error: "Email and password are required" });
			return;
		}

		console.log("Finding user with email:", email);
		try {
			const user = await prisma.user.findUnique({ where: { email } });
			if (!user) {
				console.log("User not found for email:", email);
				res.status(401).json({ error: "Invalid credentials" });
				return;
			}

			console.log("User found, comparing passwords...");
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				console.log("Password does not match for user:", email);
				res.status(401).json({ error: "Invalid credentials" });
				return;
			}

			console.log("Login successful for user ID:", user.id);
			const token = generateToken(user);
			res.status(200).json({ token });
			return;
		} catch (dbError) {
			console.error("Database error during login:", dbError);
			res.status(500).json({
				error: "Database error",
				details: dbError.message,
				stack: dbError.stack,
			});
			return;
		}
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			error: "Internal server error",
			details: error.message,
			stack: error.stack,
		});
		return;
	}
});

export default router;
