import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import redis from "../redis.js";
import polygonService from "../services/polygonService.js";

dotenv.config();
const router = express.Router();
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

router.get("/summarize", async (req, res) => {
	try {
		const { ticker } = req.query;
		if (!ticker || typeof ticker !== "string") {
			return res.status(400).json({ error: "Stock ticker is required" });
		}

		// ✅ Set cache time to 2 hours
		const cacheKey = `news_summary:${ticker}`;
		const cachedSummary = await redis.get(cacheKey);
		if (cachedSummary) {
			console.log("🔵 Returning cached AI news summary");
			return res.json(JSON.parse(cachedSummary));
		}

		// ✅ Fetch Latest News from Polygon API (rate limited)
		const newsResponse = await polygonService.getNews(ticker);

		const articles = newsResponse.results;
		if (!articles || articles.length === 0) {
			return res
				.status(404)
				.json({ error: "No news articles found for this stock." });
		}

		// ✅ Extract the Most Relevant Articles
		const latestArticles = articles.slice(0, 3).map((article) => ({
			title: article.title,
			url: article.article_url,
			published: article.published_utc,
			summary: article.description,
		}));

		const aiPrompt = `
            You are a financial analyst summarizing stock news. 
            Summarize the following news articles about ${ticker} into a short, concise financial update:
            
            ${latestArticles
							.map((a) => `- ${a.title}: ${a.summary}`)
							.join("\n")}
            
            Focus on key takeaways, stock impact, and investor relevance.
        `;

		const aiResponse = await axios.post(
			"https://api.mistral.ai/v1/chat/completions",
			{
				model: "mistral-tiny",
				messages: [{ role: "user", content: aiPrompt }],
				max_tokens: 1000,
				temperature: 0.7,
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

		// ✅ Store in Redis (cache for 2 hours)
		const responsePayload = { ticker, summarizedNews, latestArticles };
		await redis.set(cacheKey, JSON.stringify(responsePayload), { ex: 7200 });

		return res.json(responsePayload);
	} catch (error) {
		console.error("❌ Error fetching & summarizing news:", error);

		if (axios.isAxiosError(error) && error.response) {
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
