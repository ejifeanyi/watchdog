"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, X, ArrowUp, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/app/SocketProvider";

export function AlertNotifications() {
	const { notifications, dismissNotification, isConnected } = useWebSocket();
	const [isOpen, setIsOpen] = useState(false);
	const [hasNewAlerts, setHasNewAlerts] = useState(false);

	// Track notification count changes
	useEffect(() => {
		if (notifications.length > 0) {
			setHasNewAlerts(true);
			// Auto-open on new notifications if not too disruptive (optional)
			// setIsOpen(true);

			// Reset the new alert indicator after 5 seconds
			const timer = setTimeout(() => {
				setHasNewAlerts(false);
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [notifications.length]);

	// Nothing to render if no notifications and not connected
	if (notifications.length === 0 && !isConnected) return null;

	return (
		<div className="fixed bottom-4 right-4 z-50 flex flex-col items-end space-y-2">
			{isConnected && (
				<Badge
					variant="outline"
					className="bg-background text-xs flex items-center mb-1"
				>
					<span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
					Live Updates
				</Badge>
			)}

			{isOpen ? (
				<Card className="w-80 shadow-lg border-primary/10">
					<CardHeader className="pb-2">
						<div className="flex justify-between items-center">
							<CardTitle className="text-base flex items-center">
								<Bell className="h-4 w-4 mr-2" />
								Price Alerts
							</CardTitle>
							<div className="flex space-x-1">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setIsOpen(false)}
								>
									<ChevronDown className="h-4 w-4" />
								</Button>
							</div>
						</div>
						<CardDescription>
							{notifications.length > 0
								? `You have ${notifications.length} active alerts`
								: "No active alerts"}
						</CardDescription>
					</CardHeader>
					<CardContent className="max-h-96 overflow-y-auto space-y-2 pt-0">
						{notifications.length > 0 ? (
							notifications.map((notification) => (
								<Alert key={notification.alertId} className="relative py-3">
									<div className="absolute right-2 top-2">
										<Button
											variant="ghost"
											size="icon"
											className="h-5 w-5"
											onClick={() => dismissNotification(notification.alertId)}
										>
											<X className="h-3 w-3" />
										</Button>
									</div>
									<AlertTitle className="flex items-center text-sm font-medium">
										{notification.symbol}
										<Badge
											className="ml-2 bg-green-500 text-white"
											variant="secondary"
										>
											<ArrowUp className="mr-1 h-3 w-3" />$
											{notification.price.toFixed(2)}
										</Badge>
									</AlertTitle>
									<AlertDescription className="text-xs mt-1">
										{notification.message}
									</AlertDescription>
								</Alert>
							))
						) : (
							<div className="py-4 text-sm text-muted-foreground">
								No alerts yet. They&apos;ll appear here when triggered.
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				<Button
					onClick={() => setIsOpen(true)}
					size="sm"
					variant={hasNewAlerts ? "default" : "outline"}
					className={cn(
						"rounded-full flex items-center shadow-lg",
						hasNewAlerts
							? "animate-pulse bg-primary"
							: "bg-background border-primary/20"
					)}
				>
					<Bell className="h-4 w-4 mr-2" />
					{notifications.length > 0 ? (
						<>
							{notifications.length}{" "}
							{notifications.length === 1 ? "Alert" : "Alerts"}
						</>
					) : (
						<>
							<ChevronUp className="h-3 w-3 mr-1" />
							Alerts
						</>
					)}
				</Button>
			)}
		</div>
	);
}
