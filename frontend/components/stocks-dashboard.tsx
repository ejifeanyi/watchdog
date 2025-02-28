"use client";

import React, { useState, useEffect } from "react";
import { useStocks } from "@/context/stocks-context";
import TrendingStocks from "./trending-stocks";
import Watchlist from "./watchlist";
import PriceAlerts from "./price-alerts";

// Create a custom event for navigation
const NAVIGATION_EVENT = "stockDashboardNavigation";

// Export this function to be used in the Navbar component
interface DashboardView {
	view: 'trending' | 'watchlist' | 'alerts';
}

interface DashboardNavigationEvent extends CustomEvent {
	detail: DashboardView;
}

export const navigateToDashboardView = (view: DashboardView['view']): void => {
	const event = new CustomEvent(NAVIGATION_EVENT, { detail: { view } }) as DashboardNavigationEvent;
	window.dispatchEvent(event);
};

const StockDashboard = () => {
	const {} = useStocks();
	const [activeView, setActiveView] = useState("trending");

	useEffect(() => {
		// Handle the custom navigation event
		const handleNavigation = (event: Event): void => {
			const customEvent = event as CustomEvent<DashboardView>;
			if (customEvent.detail && customEvent.detail.view) {
				setActiveView(customEvent.detail.view);
			}
		};

		// Add event listener for our custom event
		window.addEventListener(NAVIGATION_EVENT, handleNavigation);

		// Legacy support for direct button clicks as well
		const handleWatchlistClick = () => setActiveView("watchlist");
		const handleAlertsClick = () => setActiveView("alerts");
		const handleTrendingClick = () => setActiveView("trending");

		// Find all buttons by their data attributes
		const watchlistButtons = document.querySelectorAll(
			"[data-watchlist-button]"
		);
		const alertsButtons = document.querySelectorAll("[data-alerts-button]");
		const trendingButtons = document.querySelectorAll("[data-trending-button]");

		// Add event listeners
		watchlistButtons.forEach((button) => {
			button.addEventListener("click", handleWatchlistClick);
		});
		alertsButtons.forEach((button) => {
			button.addEventListener("click", handleAlertsClick);
		});
		trendingButtons.forEach((button) => {
			button.addEventListener("click", handleTrendingClick);
		});

		// Cleanup event listeners
		return () => {
			window.removeEventListener(NAVIGATION_EVENT, handleNavigation);

			watchlistButtons.forEach((button) => {
				button.removeEventListener("click", handleWatchlistClick);
			});
			alertsButtons.forEach((button) => {
				button.removeEventListener("click", handleAlertsClick);
			});
			trendingButtons.forEach((button) => {
				button.removeEventListener("click", handleTrendingClick);
			});
		};
	}, []);

	// Render the active view
	return (
		<div className="space-y-6 w-full">
			{activeView === "trending" && <TrendingStocks />}
			{activeView === "watchlist" && <Watchlist />}
			{activeView === "alerts" && <PriceAlerts />}
		</div>
	);
};

export default StockDashboard;
