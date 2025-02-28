"use client";

import React, { useEffect, useState } from "react";
import { Stock } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import AlertStockCard from "./alert-stock-card";

interface AlertsProps {
	onViewDetails?: (symbol: string) => void;
}

interface AlertItem extends Stock {
	id: string;
	targetPrice: number;
	condition: "above" | "below";
}

const PriceAlerts: React.FC<AlertsProps> = ({ onViewDetails }) => {
	const [alerts, setAlerts] = useState<AlertItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [removingAlert, setRemovingAlert] = useState<Record<string, boolean>>(
		{}
	);

	const fetchAlerts = async () => {
		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem("token");

			if (!token) {
				setError("Please log in to view your price alerts");
				setLoading(false);
				return;
			}

			const response = await fetch("http://localhost:5000/api/alerts", {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.status === 401) {
				localStorage.removeItem("token");
				setError("Your session has expired. Please log in again.");
				return;
			}

			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}

			const data = await response.json();
			setAlerts(data);
		} catch (error) {
			console.error("Failed to fetch alerts:", error);
			setError("Unable to load your price alerts. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAlerts();
	}, []);

	const removeAlert = async (alertId: string) => {
		setRemovingAlert((prev) => ({ ...prev, [alertId]: true }));

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Authentication required");
			}

			const response = await fetch(
				`http://localhost:5000/api/alerts/${alertId}`,
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

			// Update the local state to remove the alert
			setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));

			toast.success("Alert Removed", {
				description: `The price alert has been removed.`,
			});
		} catch (error) {
			console.error("Failed to remove alert:", error);
			toast.error("Error", {
				description: "Failed to remove alert. Please try again.",
			});
		} finally {
			setRemovingAlert((prev) => ({ ...prev, [alertId]: false }));
		}
	};

	// Loading skeletons
	if (loading) {
		return (
			<div className="space-y-4">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Your Price Alerts</h2>
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
				<h2 className="text-xl font-semibold">Your Price Alerts</h2>
				<Button
					onClick={fetchAlerts}
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
									onClick={fetchAlerts}
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

			{/* Alerts list */}
			{alerts.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{alerts.map((alert) => (
						<AlertStockCard
							key={alert.id}
							alert={alert}
							onViewDetails={onViewDetails}
							onRemoveAlert={removeAlert}
							isLoading={removingAlert[alert.id]}
						/>
					))}
				</div>
			) : (
				<Card className="bg-muted/30">
					<CardContent className="flex flex-col items-center justify-center py-12">
						<p className="text-muted-foreground text-center mb-2">
							You don&apos;t have any price alerts set
						</p>
						<p className="text-sm text-muted-foreground text-center mb-4">
							Add price alerts from your watchlist to get notified when stocks
							reach your target price
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default PriceAlerts;
