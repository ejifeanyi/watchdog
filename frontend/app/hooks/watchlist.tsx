"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface WatchlistStock {
	symbol: string;
	userId: string;
	volume?: number;
	price?: number;
	change?: number;
	changePercent?: string;
}

export function useWatchlist() {
	const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Fetch user's watchlist
	const fetchWatchlist = useCallback(async () => {
		setIsLoading(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Authentication required");
			}

			const response = await fetch("http://localhost:5000/api/watchlist", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch watchlist");
			}

			const data = await response.json();
			setWatchlist(data);
			return data;
		} catch (error) {
			toast.error("Failed to load watchlist");
			console.error(error);
			return [];
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Add stock to watchlist
	const addToWatchlist = useCallback(async (stock: Partial<WatchlistStock>) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Authentication required");
			}

			const response = await fetch("http://localhost:5000/api/watchlist/add", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(stock),
			});

			if (!response.ok) {
				throw new Error("Failed to add to watchlist");
			}

			const data = await response.json();
			setWatchlist((prev) => {
				// Check if stock already exists in watchlist
				const exists = prev.some((item) => item.symbol === stock.symbol);
				if (exists) {
					// Update existing stock
					return prev.map((item) =>
						item.symbol === stock.symbol ? { ...item, ...data } : item
					);
				} else {
					// Add new stock
					return [...prev, data];
				}
			});

			return data;
		} catch (error) {
			console.error("Error adding to watchlist:", error);
			throw error;
		}
	}, []);

	// Remove stock from watchlist
	const removeFromWatchlist = useCallback(async (symbol: string) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Authentication required");
			}

			const response = await fetch(`http://localhost:5000/api/watchlist/${symbol}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to remove from watchlist");
			}

			setWatchlist((prev) => prev.filter((stock) => stock.symbol !== symbol));
			return true;
		} catch (error) {
			console.error("Error removing from watchlist:", error);
			throw error;
		}
	}, []);

	// Check if stock is in watchlist
	const isInWatchlist = useCallback(
		(symbol: string) => {
			return watchlist.some((stock) => stock.symbol === symbol);
		},
		[watchlist]
	);

	return {
		watchlist,
		isLoading,
		fetchWatchlist,
		addToWatchlist,
		removeFromWatchlist,
		isInWatchlist,
	};
}
