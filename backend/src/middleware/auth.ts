import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
	userId: string;
}

export const authenticate = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];

		if (!token) {
			return res.status(401).json({ error: "Authentication required" });
		}

		const decoded = jwt.verify(token, "secret") as JwtPayload;

		// Add user info to request object
		(req as any).user = { userId: decoded.userId };

		next();
	} catch (error) {
		return res.status(401).json({ error: "Invalid token" });
	}
};
