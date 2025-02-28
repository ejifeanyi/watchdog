"use client";

import React, { useState } from "react";
import { useStocks } from "@/context/stocks-context";
import { Stock } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import TrendingStockCard from "./trending-stock-card";

const TrendingStocks: React.FC = () => {
	const {
		trendingStocks,
		loadingTrending,
		trendingError,
		searchResults,
		isSearching,
		searchQuery,
		clearSearch,
		fetchTrendingStocks,
	} = useStocks();

	const [addingToWatchlist, setAddingToWatchlist] = useState<
		Record<string, boolean>
	>({});

	// Determine which stocks to show based on search state
	const displayStocks = isSearching ? searchResults : trendingStocks;

	// Function to handle going back to trending
	const handleShowTrending = () => {
		clearSearch();
		fetchTrendingStocks();
	};

	// Add to watchlist
	const addToWatchlist = async (symbol: string) => {
		setAddingToWatchlist((prev) => ({ ...prev, [symbol]: true }));

		try {
			// Find the stock data from your displayStocks array
			const stockData = displayStocks.find((stock) => stock.symbol === symbol);

			if (!stockData) {
				throw new Error("Stock data not found");
			}

			const response = await fetch("http://localhost:5000/api/watchlist/add", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					symbol,
					volume: stockData.volume,
					price: stockData.price,
					change: stockData.change,
					changePercent: stockData.changePercent,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			toast.success("Added to Watchlist", {
				description: `${symbol} has been added to your watchlist.`,
			});
		} catch (error) {
			console.error("Failed to add to watchlist:", error);
			toast.error("Error", {
				description: "Failed to add to watchlist. Please try again.",
			});
		} finally {
			setAddingToWatchlist((prev) => ({ ...prev, [symbol]: false }));
		}
	};

	// Loading skeletons
	if (loadingTrending && !isSearching) {
		return (
			<div className="space-y-4">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Trending Stocks</h2>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
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
			{/* Header with title and context-aware actions */}
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">
					{isSearching ? `Search Results: ${searchQuery}` : "Trending Stocks"}
				</h2>

				{isSearching && (
					<Button
						onClick={handleShowTrending}
						variant="outline"
						size="sm"
						className="flex items-center gap-1"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Trending
					</Button>
				)}
			</div>

			{/* Error message */}
			{trendingError && !isSearching && (
				<Card className="bg-destructive/10 border-destructive/20 mb-4">
					<CardContent className="pt-6">
						<div className="flex items-start gap-2">
							<AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
							<div>
								<p className="text-destructive">{trendingError}</p>
								<Button
									onClick={fetchTrendingStocks}
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

			{/* Search results message if no results */}
			{isSearching && searchResults.length === 0 && (
				<Card className="bg-muted/30">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground text-center mb-2">
							No stocks found matching {searchQuery}
						</p>
						<Button
							onClick={handleShowTrending}
							variant="outline"
							size="sm"
							className="mt-2"
						>
							Back to Trending
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Stock grid */}
			{displayStocks.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{displayStocks.map((stock: Stock) => (
						<TrendingStockCard
							key={stock.symbol}
							stock={stock}
							onAddToWatchlist={addToWatchlist}
							onViewDetails={(symbol) => {
								// You can implement the view details functionality here
								console.log(`View details for ${symbol}`);
							}}
							isLoading={addingToWatchlist[stock.symbol]}
						/>
					))}
				</div>
			) : (
				<Card className="bg-muted/30">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground text-center mb-2">
							No stocks available to display
						</p>
						<Button
							onClick={fetchTrendingStocks}
							variant="outline"
							size="sm"
							className="mt-2"
						>
							<RefreshCw className="h-3.5 w-3.5 mr-1.5" />
							Refresh Data
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default TrendingStocks;
