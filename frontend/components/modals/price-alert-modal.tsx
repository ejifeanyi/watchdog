"use client";

import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, ArrowUp, ArrowDown } from "lucide-react";
import { Stock } from "@/types";

interface PriceAlertDialogProps {
	isOpen: boolean;
	onClose: () => void;
	stock: Stock | null;
	onSetAlert: (symbol: string, targetPrice: number) => Promise<void>;
}

const PriceAlertDialog: React.FC<PriceAlertDialogProps> = ({
	isOpen,
	onClose,
	stock,
	onSetAlert,
}) => {
	const [targetPrice, setTargetPrice] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset state when dialog opens with new stock
	React.useEffect(() => {
		if (isOpen && stock) {
			setTargetPrice(stock.price?.toFixed(2) || "");
			setError(null);
		}
	}, [isOpen, stock]);

	const handleSubmit = async () => {
		if (!stock) return;

		const priceValue = parseFloat(targetPrice);

		// Validate input
		if (isNaN(priceValue) || priceValue <= 0) {
			setError("Please enter a valid price");
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await onSetAlert(stock.symbol, priceValue);
			onClose();
		} catch {
			setError("Failed to set alert. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Determine if target price is higher or lower than current price
	const getPriceDirection = () => {
		if (!stock?.price || !targetPrice) return null;

		const current = stock.price;
		const target = parseFloat(targetPrice);

		if (isNaN(target)) return null;

		if (target > current) {
			return {
				direction: "up",
				percent: (((target - current) / current) * 100).toFixed(2),
			};
		} else if (target < current) {
			return {
				direction: "down",
				percent: (((current - target) / current) * 100).toFixed(2),
			};
		}
		return null;
	};

	const priceDirection = getPriceDirection();

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Bell className="h-5 w-5 text-primary" />
						Set Price Alert
						{stock && (
							<span className="text-sm font-normal text-muted-foreground ml-1">
								({stock.symbol})
							</span>
						)}
					</DialogTitle>
					<DialogDescription>{stock?.name}</DialogDescription>
					{stock?.price && (
						<div className="mt-1 font-semibold">
							Current Price: ${stock.price.toFixed(2)}
						</div>
					)}
				</DialogHeader>

				<div className="grid gap-4 py-3">
					<div className="space-y-2">
						<Label htmlFor="target-price">Target Price ($)</Label>
						<div className="relative">
							<Input
								id="target-price"
								type="number"
								step="0.01"
								min="0"
								value={targetPrice}
								onChange={(e) => setTargetPrice(e.target.value)}
								className="pr-12"
								placeholder="Enter target price"
							/>
							<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
								USD
							</div>
						</div>
						{error && <p className="text-destructive text-sm">{error}</p>}
					</div>

					{priceDirection && (
						<div
							className={`text-sm px-3 py-2 rounded-md ${
								priceDirection.direction === "up"
									? "bg-green-500/10 text-green-500"
									: "bg-red-500/10 text-red-500"
							}`}
						>
							<div className="flex items-center gap-1">
								{priceDirection.direction === "up" ? (
									<ArrowUp className="h-4 w-4" />
								) : (
									<ArrowDown className="h-4 w-4" />
								)}
								<span>
									{priceDirection.direction === "up"
										? "Price needs to rise"
										: "Price needs to fall"}{" "}
									by {priceDirection.percent}%
								</span>
							</div>
						</div>
					)}
				</div>

				<DialogFooter className="sm:justify-between">
					<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Setting alert..." : "Set Alert"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default PriceAlertDialog;
