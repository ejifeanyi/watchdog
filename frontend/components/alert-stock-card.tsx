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
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Stock } from "@/types";
import { toast } from "sonner";

interface AlertItem extends Stock {
	id: string;
	targetPrice: number;
	condition: "above" | "below";
}

interface AlertStockCardProps {
	alert: AlertItem;
	onRemoveAlert?: (alertId: string) => Promise<void>;
	onViewDetails?: (symbol: string) => void;
	isLoading?: boolean;
}

const AlertStockCard: React.FC<AlertStockCardProps> = ({
	alert,
	onRemoveAlert,
	isLoading = false,
}) => {
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemoveAlert = async () => {
		if (!onRemoveAlert) return;

		setIsRemoving(true);
		try {
			await onRemoveAlert(alert.id);

			toast.success(`Alert removed`, {
				description: `Price alert for ${alert.symbol} has been removed`,
				icon: <Trash2 className="h-4 w-4" />,
			});
		} catch (error: unknown) {
			toast.error(`Failed to remove alert`, {
				description:
					error instanceof Error ? error.message : "Please try again later",
			});
		} finally {
			setIsRemoving(false);
		}
	};

	// Determine if current price is close to target (within 5%)
	const isCloseToTarget = () => {
		if (!alert.price || !alert.targetPrice) return false;
		const percentDiff =
			Math.abs((alert.price - alert.targetPrice) / alert.targetPrice) * 100;
		return percentDiff <= 5;
	};

	// Format target price condition text
	const getTargetConditionText = () => {
		return alert.condition === "above" ? "rises above" : "falls below";
	};

	// Get target progress
	const getTargetProgress = () => {
		if (!alert.price || !alert.targetPrice) return null;

		const diff = alert.targetPrice - alert.price;
		const percentDiff = ((diff / alert.price) * 100).toFixed(2);
		const direction = diff > 0 ? "up" : "down";

		return {
			direction,
			value: Math.abs(Number(percentDiff)),
			icon:
				direction === "up" ? (
					<ArrowUp className="h-3 w-3" />
				) : (
					<ArrowDown className="h-3 w-3" />
				),
		};
	};

	const progress = getTargetProgress();

	return (
		<Card
			className={`overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/30 group ${
				isCloseToTarget()
					? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/10"
					: ""
			}`}
		>
			<CardHeader className="pb-2 flex flex-row items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
						<span className="text-xs font-bold text-primary">
							{alert.symbol?.substring(0, 2)}
						</span>
					</div>

					<div>
						<CardTitle className="font-bold text-base">
							{alert.symbol}
						</CardTitle>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pb-2">
				<div className="flex items-center my-1 bg-muted/30 p-2 rounded-md">
					<div className="text-xs mr-1">
						Alert when price {getTargetConditionText()}:
					</div>
					<div className="font-semibold text-primary ml-auto">
						${alert.targetPrice.toFixed(2)}
					</div>
				</div>

				{progress && (
					<div className="text-xs flex items-center mt-2 text-muted-foreground">
						<span>Needs to go {progress.direction}</span>
						<span className="ml-1 flex items-center">
							{progress.icon}
							{progress.value}%
						</span>
						<span className="ml-1">to reach target</span>
					</div>
				)}
			</CardContent>

			<CardFooter className="pt-2 border-t">
				<Button
					variant="secondary"
					size="sm"
					className="w-full flex items-center gap-1"
					onClick={handleRemoveAlert}
					disabled={isRemoving || isLoading}
				>
					<Trash2 className="h-4 w-4" />
					Remove Alert
				</Button>
			</CardFooter>
		</Card>
	);
};

export default AlertStockCard;
