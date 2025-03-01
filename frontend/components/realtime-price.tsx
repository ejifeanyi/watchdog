"use client";

import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/app/SocketProvider";

interface RealTimePriceProps {
	symbol: string;
	initialPrice?: number; // Initial price from server if available
}

export function RealTimePrice({ symbol, initialPrice }: RealTimePriceProps) {
	const { priceUpdates } = useWebSocket();
	const [price, setPrice] = useState<number | null>(initialPrice || null);
	const [priceChange, setPriceChange] = useState<"up" | "down" | null>(null);
	const [animateChange, setAnimateChange] = useState(false);

	// Update price when it changes from the WebSocket
	useEffect(() => {
		if (priceUpdates[symbol] !== undefined) {
			const newPrice = priceUpdates[symbol];

			// Determine if price went up or down
			if (price !== null) {
				setPriceChange(
					newPrice > price ? "up" : newPrice < price ? "down" : priceChange
				);
				setAnimateChange(true);
			}

			setPrice(newPrice);

			// Reset animation after a delay
			const timer = setTimeout(() => {
				setAnimateChange(false);
			}, 2000);

			return () => clearTimeout(timer);
		}
	}, [priceUpdates, symbol, price, priceChange]);

	if (price === null) {
		return (
			<div className="flex items-center text-muted-foreground">
				<Loader2 className="h-3 w-3 animate-spin mr-1" />
				<span className="text-sm">Loading price...</span>
			</div>
		);
	}

	return (
		<div className="flex items-center font-medium">
			<span
				className={cn(
					"flex items-center",
					animateChange &&
						priceChange === "up" &&
						"text-green-500 animate-pulse",
					animateChange &&
						priceChange === "down" &&
						"text-red-500 animate-pulse"
				)}
			>
				${price.toFixed(2)}
				{priceChange === "up" && (
					<ArrowUp className="ml-1 h-3 w-3 text-green-500" />
				)}
				{priceChange === "down" && (
					<ArrowDown className="ml-1 h-3 w-3 text-red-500" />
				)}
			</span>
		</div>
	);
}
