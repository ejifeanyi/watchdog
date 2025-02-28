"use client";

import React, { useState, useEffect } from "react";
import { useStocks } from "@/context/stocks-context";
import TrendingStocks from "./trending-stocks";
import Watchlist from "./watchlist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, LineChart, TrendingUp } from "lucide-react";

const StockDashboard: React.FC = () => {
	const {} = useStocks();
	const [activeView, setActiveView] = useState<
		"trending" | "watchlist" | "alerts"
	>("trending");

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

		const handleAlertsClick = () => {
			setActiveView("alerts");
		};

		// Find all watchlist buttons
		const watchlistButtons = document.querySelectorAll(
			"[data-watchlist-button]"
		);
		watchlistButtons.forEach((button) => {
			button.addEventListener("click", handleWatchlistClick);
		});

		// Find all alerts buttons
		const alertsButtons = document.querySelectorAll("[data-alerts-button]");
		alertsButtons.forEach((button) => {
			button.addEventListener("click", handleAlertsClick);
		});

		return () => {
			watchlistButtons.forEach((button) => {
				button.removeEventListener("click", handleWatchlistClick);
			});
			alertsButtons.forEach((button) => {
				button.removeEventListener("click", handleAlertsClick);
			});
		};
	}, []);

	return (
		<div className="space-y-6 w-full">
			<Tabs
				value={activeView}
				onValueChange={(value: string) =>
					setActiveView(value as "trending" | "watchlist" | "alerts")
				}
			>
				<TabsList className="grid grid-cols-3 mb-4">
					<TabsTrigger value="trending" className="flex items-center gap-2">
						<TrendingUp className="h-4 w-4" />
						<span>Trending</span>
					</TabsTrigger>
					<TabsTrigger value="watchlist" className="flex items-center gap-2">
						<LineChart className="h-4 w-4" />
						<span>Watchlist</span>
					</TabsTrigger>
					<TabsTrigger value="alerts" className="flex items-center gap-2">
						<Bell className="h-4 w-4" />
						<span>Price Alerts</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="trending" className="mt-0">
					<TrendingStocks />
				</TabsContent>

				<TabsContent value="watchlist" className="mt-0">
					<Watchlist onViewDetails={handleViewDetails} />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default StockDashboard;
