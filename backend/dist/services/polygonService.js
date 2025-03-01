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
exports.polygonService = void 0;
// src/services/polygonService.ts
const axios_1 = __importDefault(require("axios"));
const redis_1 = __importDefault(require("../redis"));
const API_KEY = process.env.POLYGON_API_KEY || "";
const MAX_REQUESTS_PER_MINUTE = 5;
const QUEUE_KEY = "polygon_api_queue";
const COUNTER_KEY = "polygon_api_counter";
const COUNTER_RESET_SECONDS = 60; // 1 minute
class PolygonService {
    constructor() {
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.processingTimer = null;
        this.initCounter();
        this.loadQueueFromRedis();
        // Process queue every 15 seconds to spread out requests
        this.processingTimer = setInterval(() => this.processQueue(), 15000);
    }
    initCounter() {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield redis_1.default.exists(COUNTER_KEY);
            if (!exists) {
                yield redis_1.default.set(COUNTER_KEY, "0");
                yield redis_1.default.expire(COUNTER_KEY, COUNTER_RESET_SECONDS);
            }
        });
    }
    loadQueueFromRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const queueData = yield redis_1.default.get(QUEUE_KEY);
                if (queueData) {
                    this.requestQueue = JSON.parse(queueData);
                    console.log(`📋 Loaded ${this.requestQueue.length} requests from Redis queue`);
                }
            }
            catch (error) {
                console.error("Error loading queue from Redis:", error);
            }
        });
    }
    saveQueueToRedis() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield redis_1.default.set(QUEUE_KEY, JSON.stringify(this.requestQueue), "EX", 3600 // Expire after 1 hour to prevent stale queues
                );
            }
            catch (error) {
                console.error("Error saving queue to Redis:", error);
            }
        });
    }
    sortQueue() {
        // Sort by priority (higher number = higher priority)
        this.requestQueue.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Make a request to the Polygon API with rate limiting
     * @param url API endpoint without base URL and API key
     * @param config Axios request config
     * @param priority Higher number = higher priority (default: 1)
     * @returns Promise with API response
     */
    request(url_1, config_1) {
        return __awaiter(this, arguments, void 0, function* (url, config, priority = 1) {
            // First check cache
            const cacheKey = `polygon:${url.replace(/[^a-zA-Z0-9]/g, "_")}`;
            const cachedData = yield redis_1.default.get(cacheKey);
            if (cachedData) {
                console.log(`🔵 Cache hit for: ${url}`);
                return JSON.parse(cachedData);
            }
            // Not in cache, queue the request
            return new Promise((resolve, reject) => {
                this.requestQueue.push({
                    url,
                    config,
                    resolve,
                    reject,
                    priority,
                });
                this.sortQueue();
                this.saveQueueToRedis();
                if (!this.isProcessingQueue) {
                    this.processQueue();
                }
            });
        });
    }
    processQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.isProcessingQueue || this.requestQueue.length === 0) {
                return;
            }
            this.isProcessingQueue = true;
            try {
                // Check how many requests we've made in the current minute
                const counter = yield redis_1.default.get(COUNTER_KEY);
                const requestsMade = counter ? parseInt(counter, 10) : 0;
                if (requestsMade >= MAX_REQUESTS_PER_MINUTE) {
                    console.log(`⏳ Rate limit reached (${requestsMade}/${MAX_REQUESTS_PER_MINUTE}). Waiting for counter reset...`);
                    this.isProcessingQueue = false;
                    return;
                }
                // Get the next request from the queue
                const request = this.requestQueue.shift();
                if (!request) {
                    this.isProcessingQueue = false;
                    return;
                }
                // Save the updated queue
                this.saveQueueToRedis();
                // Make the request
                const { url, config, resolve, reject } = request;
                const fullUrl = `https://api.polygon.io${url}${url.includes("?") ? "&" : "?"}apiKey=${API_KEY}`;
                console.log(`📡 Making API request to: ${url.split("?")[0]}`);
                try {
                    // Increment the counter
                    yield redis_1.default.incr(COUNTER_KEY);
                    // Ensure counter expires after 1 minute to reset
                    yield redis_1.default.expire(COUNTER_KEY, COUNTER_RESET_SECONDS);
                    // Make the API request
                    const response = yield axios_1.default.get(fullUrl, Object.assign(Object.assign({}, config), { timeout: 10000, headers: Object.assign(Object.assign({}, ((config === null || config === void 0 ? void 0 : config.headers) || {})), { "User-Agent": "StockApp/1.0" }) }));
                    // Cache successful responses
                    const cacheKey = `polygon:${url.replace(/[^a-zA-Z0-9]/g, "_")}`;
                    const cacheTime = this.getCacheTimeForEndpoint(url);
                    if (cacheTime > 0 && response.data) {
                        yield redis_1.default.set(cacheKey, JSON.stringify(response.data), "EX", cacheTime);
                        console.log(`🟢 Cached response for ${url} (${cacheTime}s)`);
                    }
                    resolve(response.data);
                }
                catch (error) {
                    console.error(`❌ API request failed: ${url}`, error.message);
                    if (axios_1.default.isAxiosError(error) && ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
                        // Rate limit hit - push request back to front of queue
                        this.requestQueue.unshift(Object.assign(Object.assign({}, request), { priority: request.priority + 1 }));
                        this.saveQueueToRedis();
                        console.log(`⚠️ Rate limit hit, pushed request back to queue: ${url}`);
                    }
                    else {
                        reject(error);
                    }
                }
            }
            finally {
                this.isProcessingQueue = false;
                // Process the next request after a small delay
                // This ensures we don't immediately hit rate limits
                if (this.requestQueue.length > 0) {
                    setTimeout(() => this.processQueue(), 5000); // 5 second cooldown between requests
                }
            }
        });
    }
    // Different cache times based on endpoint type
    getCacheTimeForEndpoint(url) {
        if (url.includes("/aggs/ticker/") && url.includes("/prev")) {
            // Previous day data doesn't change during the day
            return 3600; // 1 hour
        }
        else if (url.includes("/reference/tickers")) {
            // Ticker metadata changes rarely
            return 86400; // 24 hours
        }
        else if (url.includes("/grouped/")) {
            // Grouped data for a specific day doesn't change
            return 3600 * 6; // 6 hours
        }
        else if (url.includes("/news")) {
            // News changes more frequently
            return 1800; // 30 minutes
        }
        // Default
        return 300; // 5 minutes
    }
    // Helper method for previous day data
    getPreviousDayData(ticker) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/v2/aggs/ticker/${ticker}/prev`, undefined, 5 // High priority for price data
            );
        });
    }
    // Helper for searching tickers
    searchTickers(query) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true`, undefined, 3 // Medium priority
            );
        });
    }
    // Helper for getting grouped data
    getGroupedDailyData(date) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/v2/aggs/grouped/locale/us/market/stocks/${date}`, undefined, 2 // Lower priority for bulk data
            );
        });
    }
    // Helper for getting news
    getNews(ticker) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(`/v2/reference/news?ticker=${ticker}`, undefined, 1 // Lower priority
            );
        });
    }
}
// Export a singleton instance
exports.polygonService = new PolygonService();
exports.default = exports.polygonService;
