"use client";

import React, { useState } from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Eye, TrendingUp } from "lucide-react";
import { Stock } from "@/types";
import { toast } from "sonner";
import { useAlerts } from "@/context/alert-context";

interface TrendingStockCardProps {
	stock: Stock;
	onAddToWatchlist?: (symbol: string) => Promise<void>;
	onViewDetails?: (symbol: string) => void;
	inWatchlist?: boolean;
	isLoading?: boolean;
}

const TrendingStockCard: React.FC<TrendingStockCardProps> = ({
	stock,
	onAddToWatchlist,
	inWatchlist = false,
	isLoading = false,
}) => {
	const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
	const [isAddingToAlert, setIsAddingToAlert] = useState(false);
	const { openAlertDialog } = useAlerts();

	const handleAddToWatchlist = async () => {
		if (!onAddToWatchlist) return;

		setIsAddingToWatchlist(true);
		try {
			await onAddToWatchlist(stock.symbol);

			toast.success(`${stock.symbol} added to watchlist`, {
				description: stock.name
					? `Successfully added ${stock.name}`
					: undefined,
				icon: <Eye className="h-4 w-4" />,
			});
		} catch (error: unknown) {
			toast.error(`Failed to add ${stock.symbol} to watchlist`, {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsAddingToWatchlist(false);
		}
	};

	const handleAddToAlerts = async () => {
		setIsAddingToAlert(true);
		try {
			// Open the alert dialog with the current stock
			openAlertDialog(stock);
		} catch (error: unknown) {
			toast.error(`Failed to set alert for ${stock.symbol}`, {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsAddingToAlert(false);
		}
	};

	// Determine if change is positive, negative, or neutral
	const getChangeClass = () => {
		if (
			stock.change === null ||
			stock.change === undefined ||
			stock.change === 0
		)
			return "bg-gray-500/10 text-gray-500";
		return stock.change > 0
			? "bg-green-500/10 text-green-500"
			: "bg-red-500/10 text-red-500";
	};

	return (
		<Card className="overflow-hidden transition-all duration-300 hover:shadow-md hover:shadow-primary/20 hover:border-primary/30 group">
			<CardHeader className="pb-2 flex flex-row items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
						<TrendingUp className="h-4 w-4 text-primary" />
					</div>

					<div>
						<CardTitle className="font-bold text-base">
							{stock.symbol}
						</CardTitle>
						{stock.name && (
							<p className="text-xs text-muted-foreground truncate max-w-[150px]">
								{stock.name}
							</p>
						)}
					</div>
				</div>

				<span
					className={`text-sm px-2 py-0.5 rounded-full ${getChangeClass()}`}
				>
					{stock.changePercent || "—"}
				</span>
			</CardHeader>

			<CardContent className="pb-2">
				<div className="text-2xl font-semibold mb-1 text-left">
					{stock.price ? `$${stock.price.toFixed(2)}` : "—"}
				</div>
				<div className="flex items-center my-3 justify-between">
					<p className="text-xs text-muted-foreground text-left">
						{stock.change !== null && stock.change !== undefined
							? `${stock.change > 0 ? "+" : ""}$${stock.change.toFixed(
									2
							  )} today`
							: "No change data"}
					</p>
					{stock.volume && (
						<div className="text-xs font-semibold bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
							Trending
						</div>
					)}
				</div>
			</CardContent>

			<CardFooter className="flex justify-between gap-2 pt-2 border-t">
				<Button
					variant="secondary"
					size="sm"
					className="w-1/2 flex items-center gap-1"
					onClick={handleAddToWatchlist}
					disabled={isAddingToWatchlist || inWatchlist || isLoading}
				>
					<Eye className="h-4 w-4" />
					Watch
				</Button>
				<Button
					variant="secondary"
					size="sm"
					className="flex items-center gap-1 transition-colors w-1/2"
					onClick={handleAddToAlerts}
					disabled={isAddingToAlert || isLoading}
				>
					<Bell className="h-4 w-4" />
					Alert
				</Button>
			</CardFooter>
		</Card>
	);
};

export default TrendingStockCard;
