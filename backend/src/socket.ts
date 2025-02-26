import { Server } from "socket.io";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import redis from "./redis";
import { Server as HttpServer } from "http";

const prisma = new PrismaClient();
const API_KEY = process.env.POLYGON_API_KEY || "";
const POLLING_INTERVAL = 12000; // 12 seconds

// Track connected clients for debugging
const connectedClients = new Set<string>();

function initWebSockets(server: HttpServer): Server {
	console.log("🔌 Initializing WebSockets...");

	try {
		// Create Socket.IO server instance
		const io = new Server(server, {
			cors: {
				origin: "*", // Allow all origins (adjust for production)
				methods: ["GET", "POST"],
			},
			transports: ["websocket", "polling"], // Use both WebSocket and polling
		});

		console.log("🟢 Socket.IO server instance created successfully.");

		// Handle new connections
		io.on("connection", (socket) => {
			connectedClients.add(socket.id);
			console.log(`✅ Socket connected: ${socket.id}`);
			console.log(`Active connections: ${connectedClients.size}`);

			// Send initial connection confirmation
			socket.emit("connectionConfirmed", { socketId: socket.id });

			// Handle subscription to price alerts
			socket.on("subscribeAlerts", (userId: string) => {
				const roomName = `user-${userId}`;
				socket.join(roomName);
				console.log(
					`User ${userId} subscribed to price alerts. Room: ${roomName}`
				);
				socket.emit("subscriptionConfirmed", { userId, status: "subscribed" });
			});

			// Handle disconnections
			socket.on("disconnect", (reason) => {
				connectedClients.delete(socket.id);
				console.log(`❌ Socket ${socket.id} disconnected due to ${reason}`);
				console.log(`Remaining connections: ${connectedClients.size}`);
			});
		});

		// Start polling for stock prices
		console.log("⏱️ Setting up price polling interval");
		const pollingInterval = setInterval(
			() => fetchStockPrices(io),
			POLLING_INTERVAL
		);
		console.log(
			`⏱️ Price polling set for every ${POLLING_INTERVAL / 1000} seconds`
		);

		// Cleanup function for proper shutdown
		const cleanup = () => {
			clearInterval(pollingInterval);
			io.close();
		};

		process.on("SIGINT", cleanup);
		process.on("SIGTERM", cleanup);

		console.log("🟢 WebSocket initialization completed successfully.");
		return io;
	} catch (error) {
		console.error("Failed to initialize WebSockets:", error);
		throw error;
	}
}

async function getUserWatchlist(): Promise<string[]> {
	try {
		const watchlist = await prisma.watchlist.findMany();
		return watchlist.map((stock) => stock.symbol.toUpperCase());
	} catch (error) {
		console.error("Error fetching watchlist:", error);
		return [];
	}
}

async function getStockPrice(symbol: string): Promise<number | null> {
	try {
		const cachedPrice = await redis.get(`stock:${symbol}`);

		if (cachedPrice) {
			console.log(`🔵 Cache Hit: ${symbol} = $${cachedPrice}`);
			return parseFloat(cachedPrice);
		}

		const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${API_KEY}`;
		console.log(`Fetching from: ${url}`);

		const response = await axios.get(url, {
			timeout: 5000, // Add timeout to prevent hanging requests
			headers: {
				"User-Agent": "watchdog/1.0",
			},
		});

		if (!response.data?.results?.length) {
			console.warn(`No price data found for ${symbol}`);
			return null;
		}

		const price = response.data.results[0].c || null; // Closing price

		if (price) {
			await redis.set(`stock:${symbol}`, price.toString(), "EX", 60); // Cache for 60 seconds
			console.log(
				`🟢 Cache Miss: Fetched ${symbol} = $${price} & stored in Redis`
			);
		}

		return price;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error fetching ${symbol} price:`, errorMessage);
		if (axios.isAxiosError(error)) {
			console.error(
				`Status: ${error.response?.status}, Data:`,
				error.response?.data
			);
		}
		return null;
	}
}

async function fetchStockPrices(io: Server) {
	try {
		const symbols = await getUserWatchlist();
		if (symbols.length === 0) {
			console.log("No stocks in watchlist, skipping price fetching");
			return;
		}

		console.log(`Fetching prices for: ${symbols.join(", ")}`);

		for (const symbol of symbols) {
			const price = await getStockPrice(symbol);
			if (price !== null) {
				console.log(`Broadcasting price update for ${symbol}: $${price}`);
				io.emit("priceUpdate", { symbol, price });
				await checkPriceAlerts(io, symbol, price);
			} else {
				console.warn(`No price available for ${symbol}, skipping update`);
			}
		}
	} catch (error) {
		console.error("Error in fetchStockPrices:", error);
	}
}

async function checkPriceAlerts(
	io: Server,
	symbol: string,
	currentPrice: number
) {
	try {
		const alerts = await prisma.alert.findMany({
			where: { symbol, isTriggered: false },
		});

		console.log(`Checking ${alerts.length} alerts for ${symbol}`);

		for (const alert of alerts) {
			if (currentPrice >= alert.targetPrice) {
				console.log(`🚨 Alert Triggered: ${symbol} hit $${alert.targetPrice}!`);

				// Get active socket connections for this user
				const userRoom = `user-${alert.userId}`;
				const roomSize = io.sockets.adapter.rooms.get(userRoom)?.size || 0;

				console.log(
					`Emitting alert to user ${alert.userId} (${roomSize} active connections)`
				);

				io.to(userRoom).emit("alert", {
					symbol,
					price: currentPrice,
					message: `🔔 ${symbol} has hit $${alert.targetPrice}!`,
					alertId: alert.id,
				});

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
