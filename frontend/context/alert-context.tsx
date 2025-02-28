"use client";

import React, { createContext, useState, useCallback, useContext } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Stock } from "@/types";
import PriceAlertDialog from "@/components/modals/price-alert-modal";

interface AlertContextType {
	openAlertDialog: (stock: Stock) => void;
	closeAlertDialog: () => void;
	setAlert: (symbol: string, targetPrice: number) => Promise<void>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

	const openAlertDialog = useCallback((stock: Stock) => {
		setSelectedStock(stock);
		setIsDialogOpen(true);
	}, []);

	const closeAlertDialog = useCallback(() => {
		setIsDialogOpen(false);
	}, []);

	const setAlert = useCallback(
		async (symbol: string, targetPrice: number): Promise<void> => {
			try {
				// Make sure this path is correct for your API route
				const response = await fetch("http://localhost:5000/api/alerts/add", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						// Include your auth token if required
						Authorization: `Bearer ${localStorage.getItem("token")}`, // or however you store your token
					},
					body: JSON.stringify({ symbol, targetPrice }),
				});

				if (!response.ok) {
					const errorData = await response.text();
					let errorMessage = "Failed to set alert";

					try {
						// Try to parse as JSON, but handle if it's HTML
						const jsonError = JSON.parse(errorData);
						errorMessage = jsonError.error || errorMessage;
					} catch (e) {
						// If it's not JSON (like HTML), use a generic error
						console.error(
							"Server returned non-JSON response:",
							errorData.substring(0, 100) + "...",
							e
						);
					}

					throw new Error(errorMessage);
				}

				// Show success toast
				toast.success(`Alert set for ${symbol}`, {
					description: `We'll notify you when the price reaches $${targetPrice.toFixed(
						2
					)}`,
					icon: <Bell className="h-4 w-4" />,
				});
			} catch (error) {
				console.error("Error setting alert:", error);
				throw error;
			}
		},
		[]
	);

	const value = {
		openAlertDialog,
		closeAlertDialog,
		setAlert,
	};

	return (
		<AlertContext.Provider value={value}>
			{children}
			<PriceAlertDialog
				isOpen={isDialogOpen}
				onClose={closeAlertDialog}
				stock={selectedStock}
				onSetAlert={setAlert}
			/>
		</AlertContext.Provider>
	);
};

// Custom hook for using the alert context
export const useAlerts = (): AlertContextType => {
	const context = useContext(AlertContext);
	if (context === undefined) {
		throw new Error("useAlerts must be used within an AlertProvider");
	}
	return context;
};
