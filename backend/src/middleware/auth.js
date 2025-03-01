import jwt from "jsonwebtoken";

export const authenticate = () => {
	try {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const decoded = jwt.verify(token, "secret");

		// Add user info to request object
		req.user = { userId: decoded.userId };

		next();
	} catch (error) {
		return res.status(401).json({ error: "Invalid token" });
	}
};
