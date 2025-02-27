"use client";

import React, { useState, useEffect } from "react";
import { useStocks } from "@/context/stocks-context";
import TrendingStocks from "./trending-stocks";
import Watchlist from "./watchlist";
import { Button } from "@/components/ui/button";

const StockDashboard: React.FC = () => {
	const { loadingTrending, fetchTrendingStocks } = useStocks();
	const [activeView, setActiveView] = useState<"trending" | "watchlist">(
		"trending"
	);

	// Handle view details for stocks
	const handleViewDetails = (symbol: string) => {
		console.log(`View details for ${symbol}`);
		// Implement detailed view functionality as needed
	};

	// Listen for click on watchlist button in navbar
	useEffect(() => {
		const handleWatchlistClick = () => {
			setActiveView("watchlist");
		};

		// Find all watchlist buttons
		const watchlistButtons = document.querySelectorAll(
			"[data-watchlist-button]"
		);
		watchlistButtons.forEach((button) => {
			button.addEventListener("click", handleWatchlistClick);
		});

		return () => {
			watchlistButtons.forEach((button) => {
				button.removeEventListener("click", handleWatchlistClick);
			});
		};
	}, []);

	return (
		<div className="space-y-6 w-full">
			{/* Stocks Display */}
			{activeView === "trending" ? (
				<TrendingStocks />
			) : (
				<Watchlist onViewDetails={handleViewDetails} />
			)}

			{/* Add a manual refresh button for debugging */}
			<Button
				onClick={() => fetchTrendingStocks()}
				className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
				disabled={loadingTrending}
			>
				{loadingTrending ? "Loading..." : "Refresh Stocks"}
			</Button>
		</div>
	);
};

export default StockDashboard;
