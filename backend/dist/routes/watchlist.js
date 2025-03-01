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
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// Add stock to watchlist
router.post("/add", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { symbol, volume, price, change, changePercent } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!symbol) {
        res.status(400).json({ error: "Symbol is required" });
        return;
    }
    if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
    }
    try {
        // First check if the stock already exists in the user's watchlist
        const existingStock = yield prisma.watchlist.findFirst({
            where: { symbol, userId },
        });
        if (existingStock) {
            // Update the existing stock
            const updatedStock = yield prisma.watchlist.update({
                where: { id: existingStock.id },
                data: {
                    volume,
                    price,
                    change,
                    changePercent,
                },
            });
            res.json(updatedStock);
        }
        else {
            // Create a new stock entry
            const stock = yield prisma.watchlist.create({
                data: {
                    symbol,
                    volume,
                    price,
                    change,
                    changePercent,
                    userId,
                },
            });
            res.json(stock);
        }
    }
    catch (error) {
        console.error("Error adding/updating stock to watchlist:", error);
        res.status(500).json({ error: "Failed to add stock" });
    }
}));
// Get user's watchlist
router.get("/", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
    }
    try {
        const watchlist = yield prisma.watchlist.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        res.json(watchlist);
    }
    catch (error) {
        console.error("Error fetching watchlist:", error);
        res.status(500).json({ error: "Failed to fetch watchlist" });
    }
}));
// Remove stock from watchlist
router.delete("/:symbol", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { symbol } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
    }
    try {
        yield prisma.watchlist.deleteMany({ where: { userId, symbol } });
        res.json({ message: "Stock removed successfully" });
    }
    catch (error) {
        console.error("Error removing stock from watchlist:", error);
        res.status(500).json({ error: "Failed to remove stock" });
    }
}));
// Update stock in watchlist (for refreshing price data)
router.put("/:symbol", auth_1.authenticate, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { symbol } = req.params;
    const { volume, price, change, changePercent } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
    }
    try {
        const existingStock = yield prisma.watchlist.findFirst({
            where: { symbol, userId },
        });
        if (!existingStock) {
            res.status(404).json({ error: "Stock not found in watchlist" });
            return;
        }
        const updatedStock = yield prisma.watchlist.update({
            where: { id: existingStock.id },
            data: {
                volume,
                price,
                change,
                changePercent,
                // updatedAt is handled automatically by Prisma's @updatedAt
            },
        });
        res.json(updatedStock);
    }
    catch (error) {
        console.error("Error updating stock in watchlist:", error);
        res.status(500).json({ error: "Failed to update stock" });
    }
}));
exports.default = router;
