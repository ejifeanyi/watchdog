import { Router, Request, Response } from "express";
import axios from "axios";
import redis from "../redis";

const router = Router();
const API_KEY = process.env.POLYGON_API_KEY || "";
const TRENDING_STOCKS_KEY = "trendingStocks";
const TRENDING_UPDATE_INTERVAL = 60;

const getTodayDate = () => {
	const today = new Date();
	return today.toISOString().split("T")[0]; // Returns YYYY-MM-DD
};

// Get previous trading day (simple approximation)
const getPreviousTradingDay = () => {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

	// If Monday, go back to Friday (3 days)
	// If Sunday, go back to Friday (2 days)
	// Otherwise go back 1 day
	const daysToSubtract = dayOfWeek === 1 ? 3 : dayOfWeek === 0 ? 2 : 1;

	const prevDay = new Date(today);
	prevDay.setDate(today.getDate() - daysToSubtract);

	return prevDay.toISOString().split("T")[0]; // Returns YYYY-MM-DD
};

// ✅ Route: Get Trending Stocks (Cached in Redis)
router.get("/trending", async (req: Request, res: Response) => {
	try {
		const cachedStocks = await redis.get(TRENDING_STOCKS_KEY);
		if (cachedStocks) {
			console.log("🔵 Returning cached trending stocks");
			res.json(JSON.parse(cachedStocks));
			return;
		}

		console.log("🟡 Fetching trending stocks from Polygon API");
		// Use getPreviousTradingDay() to get the last completed trading day
		const date = getPreviousTradingDay();
		const url = `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${date}?apiKey=${API_KEY}`;

		console.log(`📡 API Request: ${url.replace(API_KEY, "API_KEY_HIDDEN")}`);

		const response = await axios.get(url);

		if (!response.data || !response.data.results) {
			console.error(
				"⚠️ Unexpected API response structure:",
				JSON.stringify(response.data).substring(0, 500) + "..."
			);
			res.status(500).json({ error: "Invalid API response" });
			return;
		}

		const stocks = response.data.results || [];
		console.log(`📊 Received ${stocks.length} stocks from Polygon API`);

		const trending = stocks
			.filter((stock: any) => stock.c > 100)
			.map((stock: any) => ({
				symbol: stock.T,
				price: stock.c,
				volume: stock.v,
				change: stock.c - stock.o,
				changePercent: (((stock.c - stock.o) / stock.o) * 100).toFixed(2) + "%",
			}))
			.sort((a: any, b: any) => b.volume - a.volume);

		console.log(`✨ Filtered to ${trending.length} trending stocks`);

		console.log("📝 Sample raw stocks:", stocks.slice(0, 3));
		console.log("📝 Sample trending stocks:", trending.slice(0, 3));

		const slicedTrending = trending.slice(0, 20);

		await redis.set(
			TRENDING_STOCKS_KEY,
			JSON.stringify(slicedTrending),
			"EX",
			TRENDING_UPDATE_INTERVAL
		);
		console.log("🟢 Cached trending stocks in Redis");

		res.json(slicedTrending);
	} catch (error) {
		console.error("❌ Error fetching trending stocks:", error);

		if (axios.isAxiosError(error)) {
			console.error("🔴 Axios error details:", {
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				message: error.message,
			});
		}

		res.status(500).json({ error: "Failed to fetch trending stocks" });
	}
});

// ✅ Route: Search for Stocks (Uses Polygon API)
router.get("/search", async (req: Request, res: Response) => {
	try {
		const { query } = req.query;
		if (!query || typeof query !== "string") {
			res.status(400).json({ error: "Search query is required" });
			return;
		}

		console.log(`🔎 Searching for stocks with query: "${query}"`);

		const url = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(
			query
		)}&active=true&apiKey=${API_KEY}`;

		console.log(`📡 API Request: ${url.replace(API_KEY, "API_KEY_HIDDEN")}`);

		const response = await axios.get(url);
		const stocks = response.data.results || [];
		console.log(
			`📊 Found ${stocks.length} matching stocks for query "${query}"`
		);

		// 2️⃣ Format Results
		const filteredStocks = stocks.map((stock: any) => ({
			symbol: stock.ticker,
			name: stock.name,
		}));

		res.json(filteredStocks);
	} catch (error) {
		console.error("❌ Error searching stocks:", error);

		if (axios.isAxiosError(error)) {
			console.error("🔴 Axios error details:", {
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				message: error.message,
			});
		}

		res.status(500).json({ error: "Failed to search stocks" });
	}
});

export default router;
