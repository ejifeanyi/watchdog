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
import { Newspaper, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Article {
	title: string;
	url: string;
	published: string;
	summary: string;
}

interface StockNewsDialogProps {
	isOpen: boolean;
	onClose: () => void;
	ticker: string;
	stockName: string;
}

const StockNewsDialog: React.FC<StockNewsDialogProps> = ({
	isOpen,
	onClose,
	ticker,
	stockName,
}) => {
	const [summarizedNews, setSummarizedNews] = useState<string>("");
	const [latestArticles, setLatestArticles] = useState<Article[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchNewsSummary = async () => {
			if (!isOpen || !ticker) return;

			setIsLoading(true);
			setError(null);

			try {
				const token = localStorage.getItem("token");
				if (!token) {
					throw new Error("Authentication required");
				}

				const response = await fetch(
					`http://localhost:5000/api/news/summarize?ticker=${ticker}`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error("Failed to get news summary");
				}

				const data = await response.json();
				console.log("News summary data:", data);
				setSummarizedNews(data.summarizedNews);
				setLatestArticles(data.latestArticles || []);
			} catch (error) {
				console.error("Error fetching news summary:", error);
				setError("Failed to load news summary. Please try again.");
				toast.error(`Failed to get news for ${ticker}`);
			} finally {
				setIsLoading(false);
			}
		};

		fetchNewsSummary();
	}, [isOpen, ticker]);

	// Format the published date
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Newspaper className="h-5 w-5 text-primary" />
						{ticker} News Summary
					</DialogTitle>
					<DialogDescription>
						Latest news and updates about {stockName}
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-8">
							<Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
							<p className="text-muted-foreground">Fetching news summary...</p>
						</div>
					) : error ? (
						<div className="bg-destructive/10 text-destructive p-4 rounded-md">
							<p>{error}</p>
						</div>
					) : (
						<>
							<div className="space-y-4">
								<div className="prose dark:prose-invert max-w-none border-l-4 border-primary pl-4 py-2">
									{summarizedNews.split("\n").map((paragraph, index) => (
										<p key={index} className="my-2">
											{paragraph}
										</p>
									))}
								</div>

								<h3 className="text-lg font-semibold mt-8 mb-4">
									Recent News Articles
								</h3>

								<div className="grid gap-4">
									{latestArticles.map((article, index) => (
										<Card key={index}>
											<CardHeader className="py-3 px-4 flex flex-row items-start justify-between">
												<CardTitle className="text-base font-semibold">
													{article.title}
												</CardTitle>
												<Badge
													variant="outline"
													className="whitespace-nowrap ml-2 shrink-0"
												>
													{formatDate(article.published)}
												</Badge>
											</CardHeader>
											<CardContent className="py-3 px-4">
												<p className="text-sm text-muted-foreground mb-3">
													{article.summary}
												</p>
												<Button
													variant="outline"
													size="sm"
													className="mt-2"
													onClick={() => window.open(article.url, "_blank")}
												>
													<ExternalLink className="h-4 w-4 mr-2" />
													Read Full Article
												</Button>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button onClick={onClose}>Close</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default StockNewsDialog;
