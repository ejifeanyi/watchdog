"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const polygonService_1 = __importDefault(require("../services/polygonService"));
const redis_1 = __importDefault(require("../redis"));
const router = (0, express_1.Router)();
const TRENDING_STOCKS_KEY = "trendingStocks";
const TRENDING_UPDATE_INTERVAL = 3600; // Increase cache time to 1 hour
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
router.get("/trending", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cachedStocks = yield redis_1.default.get(TRENDING_STOCKS_KEY);
        if (cachedStocks) {
            console.log("🔵 Returning cached trending stocks");
            res.json(JSON.parse(cachedStocks));
            return;
        }
        console.log("🟡 Fetching trending stocks from Polygon API");
        // Use getPreviousTradingDay() to get the last completed trading day
        const date = getPreviousTradingDay();
        // Use our rate-limited service instead of direct axios call
        const response = yield polygonService_1.default.getGroupedDailyData(date);
        if (!response || !response.results) {
            console.error("⚠️ Unexpected API response structure:", JSON.stringify(response).substring(0, 500) + "...");
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
        yield redis_1.default.set(TRENDING_STOCKS_KEY, JSON.stringify(slicedTrending), "EX", TRENDING_UPDATE_INTERVAL);
        console.log("🟢 Cached trending stocks in Redis");
        res.json(slicedTrending);
    }
    catch (error) {
        console.error("❌ Error fetching trending stocks:", error);
        res.status(500).json({ error: "Failed to fetch trending stocks" });
    }
}));
// ✅ Route: Search for Stocks with Cached Prices
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string") {
            res.status(400).json({ error: "Search query is required" });
            return;
        }
        console.log(`🔎 Searching for stocks with query: "${query}"`);
        // Check cache for search results first
        const searchCacheKey = `search:${query.toLowerCase()}`;
        const cachedSearchResults = yield redis_1.default.get(searchCacheKey);
        if (cachedSearchResults) {
            console.log(`🔵 Cache hit for search: "${query}"`);
            res.json(JSON.parse(cachedSearchResults));
            return;
        }
        // 1️⃣ Fetch Matching Stocks (Name & Symbol)
        const response = yield polygonService_1.default.searchTickers(query);
        const stocks = response.results || [];
        if (stocks.length === 0) {
            yield redis_1.default.set(searchCacheKey, JSON.stringify([]), "EX", 3600); // Cache empty results too
            res.json([]);
            return;
        }
        console.log(`📊 Found ${stocks.length} matching stocks`);
        // 2️⃣ Batch fetch stock prices where possible
        const stocksToProcess = stocks.slice(0, 5); // Limit to 5 stocks
        // Use Promise.all for concurrent processing, but each API call is rate-limited
        const enhancedStocks = yield Promise.all(stocksToProcess.map((stock) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const cacheKey = `stock:${stock.ticker}`;
            const cachedPrice = yield redis_1.default.get(cacheKey);
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
                // Use the rate-limited version to fetch price
                const priceResponse = yield polygonService_1.default.getPreviousDayData(stock.ticker);
                const priceData = (_a = priceResponse === null || priceResponse === void 0 ? void 0 : priceResponse.results) === null || _a === void 0 ? void 0 : _a[0];
                const stockPrice = (priceData === null || priceData === void 0 ? void 0 : priceData.c) || null;
                // ✅ Cache stock price in Redis (expires in 60 minutes instead of 60 seconds)
                if (stockPrice !== null) {
                    yield redis_1.default.set(cacheKey, stockPrice.toString(), "EX", 3600);
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
                    volume: (priceData === null || priceData === void 0 ? void 0 : priceData.v) || null,
                };
            }
            catch (error) {
                console.error(`❌ Error fetching price for ${stock.ticker}:`, error.message);
                return {
                    symbol: stock.ticker,
                    name: stock.name,
                    price: null,
                    change: null,
                    changePercent: null,
                    volume: null,
                };
            }
        })));
        // Cache the search results
        yield redis_1.default.set(searchCacheKey, JSON.stringify(enhancedStocks), "EX", 1800); // 30 minutes
        console.log("✅ Enhanced stocks with prices:", enhancedStocks);
        res.json(enhancedStocks);
    }
    catch (error) {
        console.error("❌ Error searching stocks:", error);
        res.status(500).json({ error: "Failed to search stocks" });
    }
}));
exports.default = router;
