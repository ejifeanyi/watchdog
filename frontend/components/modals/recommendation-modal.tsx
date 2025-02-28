"use client";

import React, { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RecommendationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	watchlistData: Array<{ symbol: string }>;
}

const RecommendationDialog: React.FC<RecommendationDialogProps> = ({
	isOpen,
	onClose,
	watchlistData,
}) => {
	const [recommendations, setRecommendations] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchRecommendations = async () => {
			if (!isOpen || watchlistData.length === 0) return;

			setIsLoading(true);
			setError(null);

			try {
				const token = localStorage.getItem("token");
				if (!token) {
					throw new Error("Authentication required");
				}

				// Extract symbols from watchlist data
				const watchlist = watchlistData.map((stock) => stock.symbol);

				const response = await fetch("http://localhost:5000/api/ai/recommend", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ watchlist }),
				});

				if (!response.ok) {
					throw new Error("Failed to get recommendations");
				}

				const data = await response.json();
				console.log("recommend data: ", data);
				setRecommendations(data.fullResponse);
			} catch (error) {
				console.error("Error fetching recommendations:", error);
				setError("Failed to load recommendations. Please try again.");
				toast.error("Failed to get stock recommendations");
			} finally {
				setIsLoading(false);
			}
		};

		fetchRecommendations();
	}, [isOpen, watchlistData]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						Stock Recommendations
					</DialogTitle>
					<DialogDescription>
						Based on your watchlist, here are some stocks you might be
						interested in.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-8">
							<Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
							<p className="text-muted-foreground">
								Generating recommendations...
							</p>
						</div>
					) : error ? (
						<div className="text-destructive py-4">
							<p>{error}</p>
						</div>
					) : (
						<div className="prose dark:prose-invert max-w-none">
							{recommendations.split("\n").map((line, index) => {
								// Apply styling for headers (lines that might be stock symbols or headers)
								if (line.match(/^[A-Z]{1,5}:/) || line.match(/^##?#?\s/)) {
									return (
										<h3 key={index} className="font-bold mt-4 mb-2">
											{line}
										</h3>
									);
								}
								// If the line is empty, return a line break
								if (!line.trim()) {
									return <br key={index} />;
								}
								// Regular paragraph
								return (
									<p key={index} className="my-2">
										{line}
									</p>
								);
							})}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button onClick={onClose}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RecommendationDialog;
