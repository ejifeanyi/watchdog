import { Router } from "express";
import polygonService from "../services/polygonService.js";
import redis from "../redis.js";

const router = Router();
const TRENDING_STOCKS_KEY = "trendingStocks";
const TRENDING_UPDATE_INTERVAL = 3600; // Set cache time to 1 hour

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
router.get("/trending", async (req, res) => {
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

		// Use our rate-limited service instead of direct axios call
		const response = await polygonService.getGroupedDailyData(date);

		if (!response || !response.results) {
			console.error(
				"⚠️ Unexpected API response structure:",
				JSON.stringify(response).substring(0, 500) + "..."
			);
			res.status(500).json({ error: "Invalid API response" });
			return;
		}

		const stocks = response.results || [];
		console.log(`📊 Received ${stocks.length} stocks from Polygon API`);

		const trending = stocks
			.filter((stock) => stock.c > 100)
			.map((stock) => ({
				symbol: stock.T,
				price: stock.c,
				volume: stock.v,
				change: stock.c - stock.o,
				changePercent: (((stock.c - stock.o) / stock.o) * 100).toFixed(2) + "%",
			}))
			.sort((a, b) => b.volume - a.volume);

		console.log(`✨ Filtered to ${trending.length} trending stocks`);

		const slicedTrending = trending.slice(0, 20);

		await redis.set(
			TRENDING_STOCKS_KEY,
			JSON.stringify(slicedTrending),
			"ex",
			TRENDING_UPDATE_INTERVAL
		);
		console.log("🟢 Cached trending stocks in Redis");

		res.json(slicedTrending);
	} catch (error) {
		console.error("❌ Error fetching trending stocks:", error);
		res.status(500).json({ error: "Failed to fetch trending stocks" });
	}
});

// ✅ Search for Stocks with Cached Prices
router.get("/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    console.log(`🔎 Searching for stocks with query: "${query}"`);

    // Check cache for search results first
    const searchCacheKey = `search:${query.toLowerCase()}`;
    const cachedSearchResults = await redis.get(searchCacheKey);

    if (cachedSearchResults) {
      try {
        console.log(`🔵 Cache hit for search: "${query}"`);
        res.json(JSON.parse(cachedSearchResults));
        return;
      } catch (parseError) {
        console.error(`Error parsing cached search results: ${parseError.message}`);
        // Continue with fresh search if cache is corrupt
      }
    }

    // 1️⃣ Fetch Matching Stocks (Name & Symbol)
    const response = await polygonService.searchTickers(query);
    const stocks = response.results || [];

    if (stocks.length === 0) {
      await redis.set(searchCacheKey, JSON.stringify([]), "ex", 3600); // Cache empty results too
      res.json([]);
      return;
    }

    console.log(`📊 Found ${stocks.length} matching stocks`);

    // 2️⃣ Batch fetch stock prices where possible
    const stocksToProcess = stocks.slice(0, 5); // Limit to 5 stocks

    // Use Promise.all for concurrent processing, but each API call is rate-limited
    const enhancedStocks = await Promise.all(
      stocksToProcess.map(async (stock) => {
        const cacheKey = `stock:${stock.ticker}`;
        
        try {
          const cachedPrice = await redis.get(cacheKey);

          if (cachedPrice) {
            // Handle possible "[object Object]" string in cache
            if (cachedPrice === "[object Object]") {
              console.error(`❌ Corrupted cache for ${stock.ticker}, fetching fresh data`);
              // Clear corrupted cache
              await redis.del(cacheKey);
              // Skip the cache logic and fall through to fetching fresh data
            } else {
              try {
                // Try to parse as JSON
                const parsedPrice = JSON.parse(cachedPrice);
                // Extract price depending on data structure
                let finalPrice;
                
                if (typeof parsedPrice === 'object' && parsedPrice !== null) {
                  finalPrice = parsedPrice.c || parsedPrice.price || parsedPrice;
                  if (typeof finalPrice === 'object') {
                    // If still an object, something's wrong - log and fetch fresh data
                    console.error(`❌ Complex object in cache for ${stock.ticker}:`, parsedPrice);
                    // Clear corrupted cache
                    await redis.del(cacheKey);
                    // Skip to fetching fresh data
                    throw new Error("Complex object structure in cache");
                  }
                } else {
                  finalPrice = parsedPrice;
                }
                
                console.log(`🔵 Cache Hit: ${stock.ticker} = $${finalPrice}`);
                return {
                  symbol: stock.ticker,
                  name: stock.name,
                  price: typeof finalPrice === 'number' ? finalPrice : parseFloat(finalPrice),
                  change: null,
                  changePercent: null,
                  volume: null,
                };
              } catch (e) {
                // Not valid JSON, treat as a plain number string if possible
                if (!isNaN(parseFloat(cachedPrice))) {
                  console.log(`🔵 Cache Hit: ${stock.ticker} = $${cachedPrice}`);
                  return {
                    symbol: stock.ticker,
                    name: stock.name,
                    price: parseFloat(cachedPrice),
                    change: null,
                    changePercent: null,
                    volume: null,
                  };
                } else {
                  // Not a number string either, clear corrupt cache and fetch fresh data
                  console.error(`❌ Invalid cache data for ${stock.ticker}: ${cachedPrice}`);
                  await redis.del(cacheKey);
                  // Fall through to fetching fresh data
                }
              }
            }
          }

          // Fetch fresh price data
          const priceResponse = await polygonService.getPreviousDayData(
            stock.ticker
          );
          const priceData = priceResponse?.results?.[0];

          // Safely extract price data
          let stockPrice = null;
          if (priceData && typeof priceData.c !== 'undefined') {
            stockPrice = priceData.c;
          }

          // Cache price data properly
          if (stockPrice !== null) {
            // Ensure we're storing a numeric value as a string
            if (typeof stockPrice === 'number') {
              await redis.set(cacheKey, stockPrice.toString(), "ex", 3600);
            } else if (typeof stockPrice === 'object') {
              // Log this unusual case and store the entire object properly
              console.warn(`Warning: stockPrice for ${stock.ticker} is an object:`, stockPrice);
              await redis.set(cacheKey, JSON.stringify(stockPrice), "ex", 3600);
            } else {
              // String or other primitive
              await redis.set(cacheKey, stockPrice.toString(), "ex", 3600);
            }
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
        } catch (error) {
          console.error(
            `❌ Error processing ${stock.ticker}:`,
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
      })
    );

    // Cache the search results
    await redis.set(searchCacheKey, JSON.stringify(enhancedStocks), "ex", 1800); // 30 minutes

    console.log("✅ Enhanced stocks with prices:", enhancedStocks);
    res.json(enhancedStocks);
  } catch (error) {
    console.error("❌ Error searching stocks:", error);
    res.status(500).json({ error: "Failed to search stocks" });
  }
});

export default router;
