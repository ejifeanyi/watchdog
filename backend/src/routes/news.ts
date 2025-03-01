import express, { Request, Response } from "express";
import dotenv from "dotenv";
import axios from "axios";
import redis from "../redis"; // Import Redis

dotenv.config();

const router = express.Router();
const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// ✅ Route: Get Summarized Stock News
router.get("/summarize", async (req: Request, res: Response) => {
	try {
		const { ticker } = req.query;
		if (!ticker || typeof ticker !== "string") {
			return res.status(400).json({ error: "Stock ticker is required" });
		}

		// ✅ Check Redis cache first (to avoid excessive API calls)
		const cacheKey = `news_summary:${ticker}`;
		const cachedSummary = await redis.get(cacheKey);
		if (cachedSummary) {
			console.log("🔵 Returning cached AI news summary");
			return res.json(JSON.parse(cachedSummary));
		}

		// ✅ Step 1: Fetch Latest News from Polygon API
		const polygonUrl = `https://api.polygon.io/v2/reference/news?ticker=${ticker}&apiKey=${POLYGON_API_KEY}`;
		const newsResponse = await axios.get(polygonUrl);

		const articles = newsResponse.data.results;
		if (!articles || articles.length === 0) {
			return res
				.status(404)
				.json({ error: "No news articles found for this stock." });
		}

		// ✅ Step 2: Extract the Most Relevant Articles
		const latestArticles = articles.slice(0, 3).map((article: any) => ({
			title: article.title,
			url: article.article_url,
			published: article.published_utc,
			summary: article.description, // Original summary from Polygon
		}));

		// ✅ Step 3: Generate AI-Powered Summarization
		interface NewsArticle {
			title: string;
			url: string;
			published: string;
			summary: string;
		}

		const aiPrompt: string = `
                You are a financial analyst summarizing stock news. 
                Summarize the following news articles about ${ticker} into a short, concise financial update:
                
                ${(latestArticles as NewsArticle[])
									.map((a) => `- ${a.title}: ${a.summary}`)
									.join("\n")}
                
                Focus on key takeaways, stock impact, and investor relevance.
                `;

		const aiResponse = await axios.post(
			"https://api.mistral.ai/v1/chat/completions",
			{
				model: "mistral-tiny", // Consider using a more capable model if available
				messages: [{ role: "user", content: aiPrompt }],
				max_tokens: 1000, // Increased for more detailed responses
				temperature: 0.7, // Add some creativity but keep responses grounded
			},
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${MISTRAL_API_KEY}`,
				},
			}
		);

		const summarizedNews =
			aiResponse.data.choices[0].message?.content || "No summary available.";

		// ✅ Step 4: Store in Redis (cache for 1 hour)
		const responsePayload = { ticker, summarizedNews, latestArticles };
		await redis.set(cacheKey, JSON.stringify(responsePayload), "EX", 3600);

		return res.json(responsePayload);
	} catch (error: any) {
		console.error("❌ Error fetching & summarizing news:", error);

		if (error.response) {
			return res.status(error.response.status).json({
				error:
					error.response.data?.error?.message ||
					"Failed to fetch news summary.",
			});
		}

		res.status(500).json({ error: "Failed to process news summary." });
	}
});

export default router;
