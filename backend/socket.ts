import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import axios from "axios";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function initWebSockets(server: HttpServer): SocketIOServer {
	const io = new SocketIOServer(server, {
		cors: { origin: "*" },
	});

	io.on("connection", (socket) => {
		console.log("User connected:", socket.id);

		socket.on("subscribeWatchlist", async (userId: string) => {
			console.log(`User ${userId} subscribed to watchlist updates`);

			try {
				// Fetch user's watchlist
				const watchlist = await prisma.watchlist.findMany({
					where: { userId },
				});

				watchlist.forEach(({ symbol }) => {
					setInterval(async () => {
						try {
							const response = await axios.get(
								`https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${process.env.POLYGON_API_KEY}`
							);
							const currentPrice = response.data.last.price;

							// Emit price update to user
							io.to(socket.id).emit("watchlistUpdate", {
								symbol,
								price: currentPrice,
							});
						} catch (error) {
							console.error(`Error fetching ${symbol} price`, error);
						}
					}, 5000);
				});
			} catch (error) {
				console.error("Error fetching watchlist:", error);
			}
		});

		socket.on("disconnect", () => {
			console.log("User disconnected:", socket.id);
		});
	});

	return io;
}
