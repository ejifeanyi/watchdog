import { Server } from "socket.io";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const API_KEY = process.env.POLYGON_API_KEY || "";
const POLLING_INTERVAL = 12000; // 12 seconds (to stay under 5 calls/min)

async function getUserWatchlist(): Promise<string[]> {
	const watchlist = await prisma.watchlist.findMany();
	return watchlist.map((stock) => stock.symbol.toUpperCase());
}

async function fetchStockPrices(io: Server) {
	const symbols = await getUserWatchlist();
	if (symbols.length === 0) return;

	console.log(`Fetching prices for: ${symbols.join(", ")}`);

	for (const symbol of symbols) {
		try {
			const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${API_KEY}`;
			const response = await axios.get(url);
			const price = response.data.results?.[0]?.c || null; // Closing price

			if (price) {
				io.emit("priceUpdate", { symbol, price });
				await checkPriceAlerts(io, symbol, price);
			}
		} catch (error) {
			console.error(`Error fetching ${symbol} price`, error);
		}
	}
}

async function checkPriceAlerts(io: Server, symbol: string, currentPrice: number) {
	const alerts = await prisma.alert.findMany({
		where: { symbol, isTriggered: false },
	});

	for (const alert of alerts) {
		if (currentPrice >= alert.targetPrice) {
			console.log(`🚨 Alert Triggered: ${symbol} hit $${alert.targetPrice}!`);

			io.to(`user-${alert.userId}`).emit(`alert-${alert.userId}`, {
				symbol,
				price: currentPrice,
				message: `🔔 ${symbol} has hit $${alert.targetPrice}!`,
			});

			await prisma.alert.update({
				where: { id: alert.id },
				data: { isTriggered: true },
			});
		}
	}
}

function initWebSockets(server: any): Server {
	const io = new Server(server, { cors: { origin: "*" } });

	io.on("connection", (socket) => {
		console.log("User connected:", socket.id);

		socket.on("subscribeAlerts", (userId: string) => {
			socket.join(`user-${userId}`);
			console.log(`User ${userId} subscribed to price alerts.`);
		});

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);
		});
	});

	setInterval(() => fetchStockPrices(io), POLLING_INTERVAL); // Start polling every 12 sec

	// ✅ Manually trigger an alert for testing AFTER io is initialized
	// testManualAlert(io);+

	return io;
}

// 🔥 **Function to Manually Trigger an Alert for Testing**
// async function testManualAlert(io: Server) {
// 	console.log("🔵 Manually testing price alert...");
// 	const testPrice = 151; // Set a fake price to trigger an alert
// 	await checkPriceAlerts(io, "AAPL", testPrice);
// 	console.log("✅ Manual alert test completed.");
// }

export { initWebSockets };
