"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useWatchlist } from "@/app/hooks/watchlist";
import RecommendationDialog from "./modals/recommendation-modal";

interface RecommendButtonProps {
	className?: string;
}

const RecommendButton: React.FC<RecommendButtonProps> = ({ className }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const { watchlist, fetchWatchlist, isLoading } = useWatchlist();

	const handleRecommendClick = async () => {
		try {
			// Fetch or refresh the watchlist data
			const watchlistData = await fetchWatchlist();

			if (!watchlistData || watchlistData.length === 0) {
				toast.error("Please add stocks to your watchlist first");
				return;
			}

			// Open the dialog to show recommendations
			setIsDialogOpen(true);
		} catch (error) {
			console.error("Error handling recommend click:", error);
			toast.error("Failed to prepare recommendations");
		}
	};

	return (
		<>
			<Button
				variant="ghost"
				size="sm"
				className={className}
				onClick={handleRecommendClick}
				disabled={isLoading}
			>
				<Sparkles className="h-4 w-4" />
				<span>Recommend</span>
			</Button>

			<RecommendationDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				watchlistData={watchlist}
			/>
		</>
	);
};

export default RecommendButton;
