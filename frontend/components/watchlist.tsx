"use client";

import React, { useEffect, useState } from "react";
import { Stock } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import WishlistStockCard from "./watchlist-stock-card";

interface WatchlistProps {
	onViewDetails?: (symbol: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ onViewDetails }) => {
	const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [removingStock, setRemovingStock] = useState<Record<string, boolean>>(
		{}
	);

	const fetchWatchlist = async () => {
		setLoading(true);
		setError(null);

		try {
			console.log("fetching watchlist");
			// if (!token) {
			// 	setError("Please log in to view your watchlist");
			// 	setLoading(false);
			// 	return;
			// }

			// // Check if the token is expired
			// const payload = JSON.parse(atob(token.split(".")[1]));
			// if (payload.exp * 1000 < Date.now()) {
			// 	// Token is expired, attempt to refresh it
			// 	token = await refreshToken();
			// }

			const response = await fetch(
				"https://watchdog-c8e1.onrender.com/api/watchlist",
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				}
			);

			// if (response.status === 401) {
			// 	// Token is invalid even after refresh, log the user out
			// 	localStorage.removeItem("token");
			// 	setError("Your session has expired. Please log in again.");
			// 	return;
			// }

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			const data = await response.json();
			setWatchlistStocks(data);
		} catch (error) {
			console.error("Failed to fetch watchlist:", error);
			setError("Unable to load your watchlist. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchWatchlist();
	}, []);

	const removeFromWatchlist = async (symbol: string) => {
		setRemovingStock((prev) => ({ ...prev, [symbol]: true }));

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Authentication required");
			}

			const response = await fetch(
				`https://watchdog-c8e1.onrender.com/api/watchlist/${symbol}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			// Update the local state to remove the stock
			setWatchlistStocks((prev) =>
				prev.filter((stock) => stock.symbol !== symbol)
			);

			toast.success("Removed from Watchlist", {
				description: `${symbol} has been removed from your watchlist.`,
			});
		} catch (error) {
			console.error("Failed to remove from watchlist:", error);
			toast.error("Error", {
				description: "Failed to remove from watchlist. Please try again.",
			});
		} finally {
			setRemovingStock((prev) => ({ ...prev, [symbol]: false }));
		}
	};

	// Loading skeletons
	if (loading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Your Watchlist</h2>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(4)].map((_, i) => (
						<Card key={i} className="overflow-hidden">
							<CardContent className="p-4">
								<div className="flex items-center justify-between mb-2">
									<Skeleton className="h-8 w-24" />
									<Skeleton className="h-6 w-16" />
								</div>
								<Skeleton className="h-8 w-32 mb-2" />
								<Skeleton className="h-4 w-28 mb-4" />
								<div className="flex gap-2">
									<Skeleton className="h-9 w-full" />
									<Skeleton className="h-9 w-full" />
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header with title and refresh button */}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">Your Watchlist</h2>
				<Button
					onClick={fetchWatchlist}
					variant="outline"
					size="sm"
					className="flex items-center gap-1"
				>
					<RefreshCw className="h-4 w-4" />
					Refresh
				</Button>
			</div>

			{/* Error message */}
			{error && (
				<Card className="bg-destructive/10 border-destructive/20 mb-4">
					<CardContent className="pt-6">
						<div className="flex items-start gap-2">
							<AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
							<div>
								<p className="text-destructive">{error}</p>
								<Button
									onClick={fetchWatchlist}
									variant="outline"
									size="sm"
									className="mt-2 text-destructive border-destructive/30 hover:bg-destructive/10"
								>
									<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
									Try Again
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Watchlist stocks */}
			{watchlistStocks.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{watchlistStocks.map((stock) => (
						<WishlistStockCard
							key={stock.symbol}
							stock={stock}
							onViewDetails={onViewDetails}
							onRemoveFromWatchlist={removeFromWatchlist}
							isLoading={removingStock[stock.symbol]}
						/>
					))}
				</div>
			) : (
				<Card className="bg-muted/30">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground text-center mb-2">
							Your watchlist is empty
						</p>
						<p className="text-sm text-muted-foreground text-center mb-4">
							Add stocks from the Trending section to keep track of them here
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default Watchlist;
// async function refreshToken(): Promise<string | null> {
// 	try {
// 		console.log("getting refresh token");
// 		const oldToken = localStorage.getItem("token");
// 		if (!oldToken) return null;
// 		console.log("old token", oldToken);
// 		const response = await fetch(
// 			"https://watchdog-c8e1.onrender.com/api/auth/refresh",
// 			{
// 				method: "POST",
// 				headers: {
// 					Authorization: `Bearer ${oldToken}`,
// 					"Content-Type": "application/json",
// 				},
// 			}
// 		);
// 		console.log("response", response);

// 		if (!response.ok) {
// 			localStorage.removeItem("token");
// 			return null;
// 		}
// 		console.log("response 2", response);

// 		const { token } = await response.json();
// 		localStorage.setItem("token", token);
// 		console.log("new token", token);
// 		return token;
// 	} catch (error) {
// 		console.error("Failed to refresh token:", error);
// 		localStorage.removeItem("token");
// 		return null;
// 	}
// }
