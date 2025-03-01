import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import redis from "../redis.js";

dotenv.config();

const router = express.Router();

router.post("/recommend", async (req, res) => {
	try {
		const { watchlist } = req.body;

		if (!watchlist || watchlist.length === 0) {
			return res.status(400).json({ error: "Watchlist is required" });
		}

		const cacheKey = `ai_recommendations:${watchlist.join(",")}`;
		const cachedRecommendations = await redis.get(cacheKey);
		if (cachedRecommendations) {
			console.log("🔵 Returning cached AI recommendations");
			return res.json(JSON.parse(cachedRecommendations));
		}

		const prompt = `
            A user is tracking these stocks: ${watchlist.join(", ")}. 
            Based on thorough market research, provide 3 similar stocks they might be interested in.
            For each recommendation:
            1. Include the ticker symbol and full company name
            2. Briefly explain why it's similar to the stocks in their watchlist
            3. Mention relevant industry trends, historical performance, or market outlook
            4. Explain why this might complement their current portfolio
            
            Format each recommendation as a separate paragraph with clear headers.
        `;

		// Call Mistral AI REST API
		const response = await axios.post(
			"https://api.mistral.ai/v1/chat/completions",
			{
				model: "mistral-tiny",
				messages: [{ role: "user", content: prompt }],
				max_tokens: 1000,
				temperature: 0.7,
			},
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
				},
			}
		);

		const aiResponse =
			response.data.choices[0].message?.content ||
			"No recommendations available";

		const recommendations = {
			fullResponse: aiResponse,
			timestamp: new Date().toISOString(),
		};

		// Store recommendations in Redis (cache for 24 hours)
		await redis.set(cacheKey, JSON.stringify(recommendations), { ex: 86400 });

		return res.json(recommendations);
	} catch (error) {
		console.error("❌ Error getting AI recommendations:", error);

		const errorMessage =
			error.response?.data?.error?.message ||
			error.message ||
			"Failed to generate recommendations";
		const statusCode = error.response?.status || 500;

		return res.status(statusCode).json({
			error: errorMessage,
			details: process.env.NODE_ENV === "development" ? error.stack : undefined,
		});
	}
});

export default router;
