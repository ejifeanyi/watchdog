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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const redis_1 = __importDefault(require("../redis"));
dotenv_1.default.config();
const router = express_1.default.Router();
// AI Route: Get Stock Recommendations
router.post("/recommend", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { watchlist } = req.body;
        if (!watchlist || watchlist.length === 0) {
            return res.status(400).json({ error: "Watchlist is required" });
        }
        // Check Redis cache first
        const cacheKey = `ai_recommendations:${watchlist.join(",")}`;
        const cachedRecommendations = yield redis_1.default.get(cacheKey);
        if (cachedRecommendations) {
            console.log("🔵 Returning cached AI recommendations");
            return res.json(JSON.parse(cachedRecommendations));
        }
        // Create a more detailed prompt that requests market research and history
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
        const response = yield axios_1.default.post("https://api.mistral.ai/v1/chat/completions", {
            model: "mistral-tiny", // Consider using a more capable model if available
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1000, // Increased for more detailed responses
            temperature: 0.7, // Add some creativity but keep responses grounded
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
        });
        // Extract AI response - keep the full formatted response
        const aiResponse = ((_a = response.data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) ||
            "No recommendations available";
        // Process the response for better presentation
        const recommendations = {
            fullResponse: aiResponse,
            // You could add additional processing here if needed
            timestamp: new Date().toISOString(),
        };
        // Store recommendations in Redis (cache for 24 hours)
        yield redis_1.default.set(cacheKey, JSON.stringify(recommendations), "EX", 86400);
        return res.json(recommendations);
    }
    catch (error) {
        console.error("❌ Error getting AI recommendations:", error);
        // Better error handling with more detailed information
        const errorMessage = ((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) ||
            error.message ||
            "Failed to generate recommendations";
        const statusCode = ((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 500;
        return res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === "development" ? error.stack : undefined,
        });
    }
}));
exports.default = router;
