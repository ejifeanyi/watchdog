import { Router, Request, Response } from "express";
import axios from "axios";
import redis from "../redis";

const router = Router();
const API_KEY = process.env.POLYGON_API_KEY || "";
const TRENDING_STOCKS_KEY = "trendingStocks";
const TRENDING_UPDATE_INTERVAL = 60;

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

// ✅ Route: Search for Stocks with Cached Prices
router.get("/search", async (req: Request, res: Response) => {
	try {
		const { query } = req.query;
		if (!query || typeof query !== "string") {
			res.status(400).json({ error: "Search query is required" });
			return; // Early return is fine, but don't return the response object
		}

		console.log(`🔎 Searching for stocks with query: "${query}"`);

		// 1️⃣ Fetch Matching Stocks (Name & Symbol)
		const url = `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(
			query
		)}&active=true&apiKey=${API_KEY}`;
		const response = await axios.get(url);
		const stocks = response.data.results || [];

		if (stocks.length === 0) {
			res.json([]); // No return here
			return;
		}

		console.log(`📊 Found ${stocks.length} matching stocks`);

		// 2️⃣ Fetch Stock Prices (Check Redis First)
		const priceRequests = stocks.slice(0, 5).map(async (stock: any) => {
			const cacheKey = `stock:${stock.ticker}`;
			const cachedPrice = await redis.get(cacheKey);

			if (cachedPrice) {
				console.log(`🔵 Cache Hit: ${stock.ticker} = $${cachedPrice}`);
				return {
					symbol: stock.ticker,
					name: stock.name,
					price: parseFloat(cachedPrice),
					change: null,
					changePercent: null,
					volume: null,
				};
			}

			try {
				const priceUrl = `https://api.polygon.io/v2/aggs/ticker/${stock.ticker}/prev?apiKey=${API_KEY}`;
				const priceResponse = await axios.get(priceUrl);
				const priceData = priceResponse.data.results?.[0];

				const stockPrice = priceData?.c || null;

				// ✅ Cache stock price in Redis (expires in 60 sec)
				if (stockPrice !== null) {
					await redis.set(cacheKey, stockPrice.toString(), "EX", 60);
				}

				return {
					symbol: stock.ticker,
					name: stock.name,
					price: stockPrice,
					change: priceData ? priceData.c - priceData.o : null,
					changePercent: priceData
						? (((priceData.c - priceData.o) / priceData.o) * 100).toFixed(2) +
						  "%"
						: null,
					volume: priceData?.v || null,
				};
			} catch (error: any) {
				if (error.response?.status === 429) {
					console.error(
						`❌ Rate limit hit for ${stock.ticker}: Returning cached price if available.`
					);
					const cachedFallback = await redis.get(cacheKey);
					return {
						symbol: stock.ticker,
						name: stock.name,
						price: cachedFallback ? parseFloat(cachedFallback) : null,
						change: null,
						changePercent: null,
						volume: null,
					};
				}
				console.error(
					`❌ Error fetching price for ${stock.ticker}:`,
					error.message
				);
				return {
					symbol: stock.ticker,
					name: stock.name,
					price: null,
					change: null,
					changePercent: null,
					volume: null,
				};
			}
		});

		const enhancedStocks = await Promise.all(priceRequests);

		console.log("✅ Enhanced stocks with prices:", enhancedStocks);
		res.json(enhancedStocks); // No return here
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

		res.status(500).json({ error: "Failed to search stocks" }); // No return here
	}
});
export default router;
