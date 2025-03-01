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
import { Bell, Trash2 } from "lucide-react";
import { Stock } from "@/types";
import { toast } from "sonner";
import { useAlerts } from "@/context/alert-context";
import StockNewsButton from "./news-button";

interface WishlistStockCardProps {
	stock: Stock;
	onRemoveFromWatchlist?: (symbol: string) => Promise<void>;
	onViewDetails?: (symbol: string) => void;
	isLoading?: boolean;
}

const WishlistStockCard: React.FC<WishlistStockCardProps> = ({
	stock,
	onRemoveFromWatchlist,
	isLoading = false,
}) => {
	const [isRemoving, setIsRemoving] = useState(false);
	const [isAddingToAlert, setIsAddingToAlert] = useState(false);
	const { openAlertDialog } = useAlerts();

	const handleRemoveFromWatchlist = async () => {
		if (!onRemoveFromWatchlist) return;

		setIsRemoving(true);
		try {
			await onRemoveFromWatchlist(stock.symbol);

			toast.success(`${stock.symbol} removed from watchlist`, {
				description: stock.name
					? `Successfully removed ${stock.name}`
					: undefined,
				icon: <Trash2 className="h-4 w-4" />,
			});
		} catch (error: unknown) {
			toast.error(`Failed to remove ${stock.symbol} from watchlist`, {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsRemoving(false);
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
		if (!stock.change || stock.change === 0)
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
						<span className="text-xs font-bold text-primary">
							{stock.symbol?.substring(0, 2)}
						</span>
					</div>

					<div>
						<div className="flex items-center gap-4">
							<CardTitle className="font-bold text-base">
								{stock.symbol}
							</CardTitle>
							<StockNewsButton
								ticker={stock.symbol}
								stockName={stock.name}
								className="w-1/3"
								disabled={isLoading}
							/>
						</div>
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
				<div className="flex items-center my-3">
					<p className="text-xs text-muted-foreground text-left mr-3">
						{stock.change != null
							? `${stock.change > 0 ? "+" : ""}$${stock.change.toFixed(
									2
							  )} today`
							: "No change data"}
					</p>
					{stock.volume && (
						<div className="text-xs text-muted-foreground text-left">
							Vol: {new Intl.NumberFormat().format(stock.volume)}
						</div>
					)}
				</div>
			</CardContent>

			<CardFooter className="flex justify-between gap-2 pt-2 border-t">
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
				<Button
					variant="secondary"
					size="sm"
					className="w-1/2 flex items-center gap-1"
					onClick={handleRemoveFromWatchlist}
					disabled={isRemoving || isLoading}
				>
					<Trash2 className="h-4 w-4" />
					Remove
				</Button>
			</CardFooter>
		</Card>
	);
};

export default WishlistStockCard;
