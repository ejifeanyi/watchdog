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
const polygonService_1 = __importDefault(require("../services/polygonService"));
dotenv_1.default.config();
const router = express_1.default.Router();
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
// ✅ Route: Get Summarized Stock News
router.get("/summarize", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { ticker } = req.query;
        if (!ticker || typeof ticker !== "string") {
            return res.status(400).json({ error: "Stock ticker is required" });
        }
        // ✅ Increase cache time to 2 hours
        const cacheKey = `news_summary:${ticker}`;
        const cachedSummary = yield redis_1.default.get(cacheKey);
        if (cachedSummary) {
            console.log("🔵 Returning cached AI news summary");
            return res.json(JSON.parse(cachedSummary));
        }
        // ✅ Step 1: Fetch Latest News from Polygon API (rate limited)
        const newsResponse = yield polygonService_1.default.getNews(ticker);
        const articles = newsResponse.results;
        if (!articles || articles.length === 0) {
            return res
                .status(404)
                .json({ error: "No news articles found for this stock." });
        }
        // ✅ Step 2: Extract the Most Relevant Articles
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
        const aiResponse = yield axios_1.default.post("https://api.mistral.ai/v1/chat/completions", {
            model: "mistral-tiny",
            messages: [{ role: "user", content: aiPrompt }],
            max_tokens: 1000,
            temperature: 0.7,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MISTRAL_API_KEY}`,
            },
        });
        const summarizedNews = ((_a = aiResponse.data.choices[0].message) === null || _a === void 0 ? void 0 : _a.content) || "No summary available.";
        // ✅ Step 4: Store in Redis (cache for 2 hours)
        const responsePayload = { ticker, summarizedNews, latestArticles };
        yield redis_1.default.set(cacheKey, JSON.stringify(responsePayload), "EX", 7200);
        return res.json(responsePayload);
    }
    catch (error) {
        console.error("❌ Error fetching & summarizing news:", error);
        if (axios_1.default.isAxiosError(error) && error.response) {
            return res.status(error.response.status).json({
                error: ((_c = (_b = error.response.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message) ||
                    "Failed to fetch news summary.",
            });
        }
        res.status(500).json({ error: "Failed to process news summary." });
    }
}));
exports.default = router;
