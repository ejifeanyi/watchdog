import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import redis from "./redis.js";
import polygonService from "./services/polygonService.js";

const prisma = new PrismaClient();
const POLLING_INTERVAL = 30000; // Increased to 30 seconds
const connectedClients = new Set();

// Track which symbols we're monitoring to batch API calls
const monitoredSymbols = new Set();

function initWebSockets(server) {
	console.log("🔌 Initializing WebSockets...");

	try {
		const io = new Server(server, {
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
		const pollingInterval = setInterval(
			() => fetchBatchedStockPrices(io),
			POLLING_INTERVAL
		);

		// Initial symbol load
		updateMonitoredSymbols();

		console.log(
			`⏱️ Price polling set for every ${POLLING_INTERVAL / 1000} seconds`
		);

		process.on("SIGINT", () => clearInterval(pollingInterval));
		process.on("SIGTERM", () => clearInterval(pollingInterval));

		return io;
	} catch (error) {
		console.error("Failed to initialize WebSockets:", error);
		throw error;
	}
}

// Updates the list of symbols we need to monitor
async function updateMonitoredSymbols() {
	try {
		// Get all unique stock symbols from both watchlists and alerts
		const watchlistItems = await prisma.watchlist.findMany({
			select: { symbol: true },
			distinct: ["symbol"],
		});

		const alertItems = await prisma.alert.findMany({
			where: { isTriggered: false },
			select: { symbol: true },
			distinct: ["symbol"],
		});

		// Clear the current set and add all symbols
		monitoredSymbols.clear();

		watchlistItems.forEach((item) =>
			monitoredSymbols.add(item.symbol.toUpperCase())
		);
		alertItems.forEach((item) =>
			monitoredSymbols.add(item.symbol.toUpperCase())
		);

		console.log(
			`Updated monitored symbols: ${Array.from(monitoredSymbols).join(", ")}`
		);
	} catch (error) {
		console.error("Error updating monitored symbols:", error);
	}
}

// batched approach to fetch prices
async function fetchBatchedStockPrices(io) {
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
	const currentBatchIndex = parseInt((await redis.get(batchKey)) || "0");
	const nextBatchIndex = (currentBatchIndex + 1) % batches.length;

	// Store the next batch index for the next run
	await redis.set(batchKey, nextBatchIndex.toString());

	// Get the current batch to process
	const currentBatch = batches[currentBatchIndex];

	if (!currentBatch || currentBatch.length === 0) {
		return;
	}

	console.log(
		`Processing batch ${currentBatchIndex + 1}/${
			batches.length
		}: ${currentBatch.join(", ")}`
	);

	for (const symbol of currentBatch) {
		try {
			const price = await getStockPrice(symbol);

			if (price !== null) {
				io.emit("priceUpdate", { symbol, price });
				await checkPriceAlerts(io, symbol, price);
			}
		} catch (error) {
			console.error(`Error updating price for ${symbol}:`, error);
		}
	}
}

async function getStockPrice(symbol) {
	try {
		const cachedPrice = await redis.get(`stock:${symbol}`);

		if (cachedPrice) {
			console.log(`🔵 Cache Hit: ${symbol} = $${cachedPrice}`);
			return parseFloat(cachedPrice);
		}

		console.log(`🟡 Cache miss for ${symbol}, fetching from API`);

		const response = await polygonService.getPreviousDayData(symbol);

		if (!response?.results?.length) {
			console.warn(`No price data found for ${symbol}`);
			return null;
		}

		const price = response.results[0].c || null;

		if (price !== null) {
			// Cache price for 1 hour instead of 60 seconds
			await redis.set(`stock:${symbol}`, price.toString(), { ex: 3600 });
			console.log(`🟢 Fetched ${symbol} = $${price} & stored in Redis`);
		}

		return price;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error fetching ${symbol} price:`, errorMessage);
		return null;
	}
}

async function checkPriceAlerts(io, symbol, currentPrice) {
	try {
		const alerts = await prisma.alert.findMany({
			where: { symbol, isTriggered: false },
		});

		for (const alert of alerts) {
			if (currentPrice >= alert.targetPrice) {
				console.log(`🚨 Alert Triggered: ${symbol} hit $${alert.targetPrice}!`);

				const userRoom = `user-${alert.userId}`;
				const roomSize = io.sockets.adapter.rooms.get(userRoom)?.size || 0;

				if (roomSize > 0) {
					io.to(userRoom).emit("alert", {
						symbol,
						price: currentPrice,
						message: `🔔 ${symbol} has hit $${alert.targetPrice}!`,
						alertId: alert.id,
					});
				}

				await prisma.alert.update({
					where: { id: alert.id },
					data: { isTriggered: true },
				});
			}
		}
	} catch (error) {
		console.error("Error in checkPriceAlerts:", error);
	}
}

export { initWebSockets };
