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
exports.initWebSockets = initWebSockets;
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const redis_1 = __importDefault(require("./redis"));
const polygonService_1 = __importDefault(require("./services/polygonService"));
const prisma = new client_1.PrismaClient();
const POLLING_INTERVAL = 30000; // Increased to 30 seconds
const connectedClients = new Set();
// Track which symbols we're monitoring to batch API calls
const monitoredSymbols = new Set();
function initWebSockets(server) {
    console.log("🔌 Initializing WebSockets...");
    try {
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
            transports: ["websocket", "polling"],
        });
        console.log("🟢 Socket.IO server instance created successfully.");
        io.on("connection", (socket) => {
            connectedClients.add(socket.id);
            console.log(`✅ Socket connected: ${socket.id}`);
            socket.emit("connectionConfirmed", { socketId: socket.id });
            socket.on("subscribeAlerts", (userId) => {
                const roomName = `user-${userId}`;
                socket.join(roomName);
                console.log(`User ${userId} subscribed to alerts. Room: ${roomName}`);
                socket.emit("subscriptionConfirmed", { userId, status: "subscribed" });
            });
            socket.on("disconnect", (reason) => {
                connectedClients.delete(socket.id);
                console.log(`❌ Socket ${socket.id} disconnected due to ${reason}`);
            });
        });
        // ✨ Optimized price polling with batch updates
        console.log("⏱️ Setting up price polling interval");
        // Update monitored symbols list every 5 minutes
        setInterval(updateMonitoredSymbols, 300000);
        // Start polling for prices (but with batched updates)
        const pollingInterval = setInterval(() => fetchBatchedStockPrices(io), POLLING_INTERVAL);
        // Initial symbol load
        updateMonitoredSymbols();
        console.log(`⏱️ Price polling set for every ${POLLING_INTERVAL / 1000} seconds`);
        process.on("SIGINT", () => clearInterval(pollingInterval));
        process.on("SIGTERM", () => clearInterval(pollingInterval));
        return io;
    }
    catch (error) {
        console.error("Failed to initialize WebSockets:", error);
        throw error;
    }
}
// Updates the list of symbols we need to monitor
function updateMonitoredSymbols() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get all unique stock symbols from both watchlists and alerts
            const watchlistItems = yield prisma.watchlist.findMany({
                select: { symbol: true },
                distinct: ["symbol"],
            });
            const alertItems = yield prisma.alert.findMany({
                where: { isTriggered: false },
                select: { symbol: true },
                distinct: ["symbol"],
            });
            // Clear the current set and add all symbols
            monitoredSymbols.clear();
            watchlistItems.forEach((item) => monitoredSymbols.add(item.symbol.toUpperCase()));
            alertItems.forEach((item) => monitoredSymbols.add(item.symbol.toUpperCase()));
            console.log(`Updated monitored symbols: ${Array.from(monitoredSymbols).join(", ")}`);
        }
        catch (error) {
            console.error("Error updating monitored symbols:", error);
        }
    });
}
// New batched approach to fetch prices
function fetchBatchedStockPrices(io) {
    return __awaiter(this, void 0, void 0, function* () {
        if (monitoredSymbols.size === 0) {
            console.log("No stocks to monitor, skipping price updates");
            return;
        }
        console.log(`Fetching prices for ${monitoredSymbols.size} symbols`);
        // Group symbols into batches of max 5 (Polygon's limits for multiple tickers)
        const symbolsArray = Array.from(monitoredSymbols);
        const batches = [];
        for (let i = 0; i < symbolsArray.length; i += 5) {
            batches.push(symbolsArray.slice(i, i + 5));
        }
        console.log(`Split into ${batches.length} batches`);
        // Process one batch per polling interval to stay within rate limits
        // We'll cycle through batches on each interval
        const batchKey = "current_symbol_batch";
        const currentBatchIndex = parseInt((yield redis_1.default.get(batchKey)) || "0");
        const nextBatchIndex = (currentBatchIndex + 1) % batches.length;
        // Store the next batch index for the next run
        yield redis_1.default.set(batchKey, nextBatchIndex.toString());
        // Get the current batch to process
        const currentBatch = batches[currentBatchIndex];
        if (!currentBatch || currentBatch.length === 0) {
            return;
        }
        console.log(`Processing batch ${currentBatchIndex + 1}/${batches.length}: ${currentBatch.join(", ")}`);
        for (const symbol of currentBatch) {
            try {
                const price = yield getStockPrice(symbol);
                if (price !== null) {
                    io.emit("priceUpdate", { symbol, price });
                    yield checkPriceAlerts(io, symbol, price);
                }
            }
            catch (error) {
                console.error(`Error updating price for ${symbol}:`, error);
            }
        }
    });
}
function getStockPrice(symbol) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const cachedPrice = yield redis_1.default.get(`stock:${symbol}`);
            if (cachedPrice) {
                console.log(`🔵 Cache Hit: ${symbol} = $${cachedPrice}`);
                return parseFloat(cachedPrice);
            }
            console.log(`🟡 Cache miss for ${symbol}, fetching from API`);
            const response = yield polygonService_1.default.getPreviousDayData(symbol);
            if (!((_a = response === null || response === void 0 ? void 0 : response.results) === null || _a === void 0 ? void 0 : _a.length)) {
                console.warn(`No price data found for ${symbol}`);
                return null;
            }
            const price = response.results[0].c || null;
            if (price !== null) {
                // Cache price for 1 hour instead of 60 seconds
                yield redis_1.default.set(`stock:${symbol}`, price.toString(), "EX", 3600);
                console.log(`🟢 Fetched ${symbol} = $${price} & stored in Redis`);
            }
            return price;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error fetching ${symbol} price:`, errorMessage);
            return null;
        }
    });
}
function checkPriceAlerts(io, symbol, currentPrice) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const alerts = yield prisma.alert.findMany({
                where: { symbol, isTriggered: false },
            });
            for (const alert of alerts) {
                if (currentPrice >= alert.targetPrice) {
                    console.log(`🚨 Alert Triggered: ${symbol} hit $${alert.targetPrice}!`);
                    const userRoom = `user-${alert.userId}`;
                    const roomSize = ((_a = io.sockets.adapter.rooms.get(userRoom)) === null || _a === void 0 ? void 0 : _a.size) || 0;
                    if (roomSize > 0) {
                        io.to(userRoom).emit("alert", {
                            symbol,
                            price: currentPrice,
                            message: `🔔 ${symbol} has hit $${alert.targetPrice}!`,
                            alertId: alert.id,
                        });
                    }
                    yield prisma.alert.update({
                        where: { id: alert.id },
                        data: { isTriggered: true },
                    });
                }
            }
        }
        catch (error) {
            console.error("Error in checkPriceAlerts:", error);
        }
    });
}
