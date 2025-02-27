import { Router, Request, Response } from "express";
import axios from "axios";
import redis from "../redis";

const router = Router();
const API_KEY = process.env.POLYGON_API_KEY || "";
const TRENDING_STOCKS_KEY = "trendingStocks";
const TRENDING_UPDATE_INTERVAL = 60; // Cache for 60 seconds

// ✅ Route: Get Trending Stocks (Cached in Redis)
router.get("/trending", async (req: Request, res: Response) => {
	try {
		// 1️⃣ Check Redis Cache
		const cachedStocks = await redis.get(TRENDING_STOCKS_KEY);
		if (cachedStocks) {
			console.log("🔵 Returning cached trending stocks");
			res.json(JSON.parse(cachedStocks));
			return;
		}

		// 2️⃣ Fetch Trending Stocks from Polygon API
		const url = `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/prev?apiKey=${API_KEY}`;
		const response = await axios.get(url);
		const stocks = response.data.results || [];

		// 3️⃣ Filter and Format Trending Stocks
		const trending = stocks
			.filter((stock: any) => stock.c > 100) // Example: Show only stocks with closing price > $100
			.map((stock: any) => ({
				symbol: stock.T,
				price: stock.c,
				volume: stock.v,
			}));

		// 4️⃣ Cache Trending Stocks in Redis (Valid for 60 seconds)
		await redis.set(
			TRENDING_STOCKS_KEY,
			JSON.stringify(trending),
			"EX",
			TRENDING_UPDATE_INTERVAL
		);
		console.log("🟢 Cached trending stocks in Redis");

		res.json(trending);
	} catch (error) {
		console.error("❌ Error fetching trending stocks:", error);
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

		// 1️⃣ Fetch Matching Stocks from Polygon API
		const url = `https://api.polygon.io/v3/reference/tickers?search=${query}&active=true&apiKey=${API_KEY}`;
		const response = await axios.get(url);
		const stocks = response.data.results || [];

		// 2️⃣ Format Results
		const filteredStocks = stocks.map((stock: any) => ({
			symbol: stock.ticker,
			name: stock.name,
		}));

		res.json(filteredStocks);
	} catch (error) {
		console.error("❌ Error searching stocks:", error);
		res.status(500).json({ error: "Failed to search stocks" });
	}
});

export default router;
