"use client";

import React from "react";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Eye, LineChart } from "lucide-react";
import { Stock } from "@/types";
import { toast } from "sonner";

interface StockCardProps {
	stock: Stock;
	onAddToWatchlist?: (symbol: string) => Promise<void>;
	onSetAlert?: (symbol: string, price: number) => Promise<void>;
	onViewDetails?: (symbol: string) => void;
	inWatchlist?: boolean;
	hasAlert?: boolean;
	showActions?: boolean;
	isLoading?: boolean;
	customButtons?: React.ReactNode;
}

const StockCard: React.FC<StockCardProps> = ({
	stock,
	onAddToWatchlist,
	onSetAlert,
	onViewDetails,
	inWatchlist = false,
	hasAlert = false,
	showActions = true,
	isLoading = false,
	customButtons = null,
}) => {
	const [isAddingToWatchlist, setIsAddingToWatchlist] = React.useState(false);
	const [isSettingAlert, setIsSettingAlert] = React.useState(false);

	const handleAddToWatchlist = async () => {
		if (!onAddToWatchlist) return;

		setIsAddingToWatchlist(true);
		try {
			// Call the provided callback instead of making a direct fetch
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

	const handleSetAlert = async () => {
		if (!onSetAlert) return;

		setIsSettingAlert(true);
		try {
			await onSetAlert(stock.symbol, stock.price || 0);
			toast.success(`Alert set for ${stock.symbol}`, {
				description: `We'll notify you of significant changes`,
				icon: <Bell className="h-4 w-4" />,
			});
		} catch (error: unknown) {
			toast.error(`Failed to set alert for ${stock.symbol}`, {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsSettingAlert(false);
		}
	};

	const handleViewDetails = () => {
		if (onViewDetails) {
			onViewDetails(stock.symbol);
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
				<div className="flex items-center my-3">
					<p className="text-xs text-muted-foreground text-left mr-3">
						{stock.change !== undefined
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
				{customButtons ? (
					customButtons
				) : showActions ? (
					<>
						<Button
							variant={inWatchlist ? "default" : "secondary"}
							size="sm"
							className="flex items-center gap-1 group-hover:border-primary/50 transition-colors w-1/2"
							onClick={handleAddToWatchlist}
							disabled={isAddingToWatchlist || inWatchlist || isLoading}
						>
							<Eye className="h-4 w-4" />
							{inWatchlist ? "Watching" : "Watch"}
						</Button>
						<Button
							variant={hasAlert ? "default" : "secondary"}
							size="sm"
							className="flex items-center gap-1 group-hover:border-primary/50 transition-colors w-1/2"
							onClick={handleSetAlert}
							disabled={isSettingAlert || !stock.price || hasAlert || isLoading}
						>
							<Bell className="h-4 w-4" />
							{hasAlert ? "Alerted" : "Alert"}
						</Button>
					</>
				) : (
					<Button
						variant="outline"
						size="sm"
						className="w-full flex items-center gap-1"
						onClick={handleViewDetails}
					>
						<LineChart className="h-4 w-4" />
						View Details
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};

export default StockCard;
