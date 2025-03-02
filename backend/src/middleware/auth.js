import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			console.log("No token provided"); // Log for debugging
			return res.status(401).json({ error: "Authentication required" });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

		// Add user info to request object
		req.user = { userId: decoded.userId };

		next();
	} catch (error) {
		console.log("Token verification failed:", error.message); // Log for debugging
		return res.status(401).json({ error: "Invalid token" });
	}
};
