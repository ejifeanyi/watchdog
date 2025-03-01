"use client";

import React, { useState } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Newspaper } from "lucide-react";
import StockNewsDialog from "./modals/new-summary-modal";

interface StockNewsButtonProps extends Omit<ButtonProps, "onClick"> {
	ticker: string;
	stockName?: string;
	iconOnly?: boolean;
}

const StockNewsButton: React.FC<StockNewsButtonProps> = ({
	ticker,
	stockName,
	className,
	disabled,
	variant = "secondary",
	size = "sm",
	...buttonProps
}) => {
	const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);

	const handleOpenNewsDialog = () => {
		setIsNewsDialogOpen(true);
	};

	return (
		<>
			<Button
				variant={variant}
				size={size}
				className={className}
				onClick={handleOpenNewsDialog}
				disabled={disabled}
				{...buttonProps}
			>
				<Newspaper className="h-4 w-4" />
			</Button>

			<StockNewsDialog
				isOpen={isNewsDialogOpen}
				onClose={() => setIsNewsDialogOpen(false)}
				ticker={ticker}
				stockName={stockName || ticker}
			/>
		</>
	);
};

export default StockNewsButton;
