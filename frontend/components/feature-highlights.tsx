import React from "react";
import { Card } from "./ui/card";

interface FeatureItem {
	icon: React.ReactNode;
	title: string;
	description: string;
}

const FeatureHighlights: React.FC = () => {
	const features: FeatureItem[] = [
		{
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5 text-primary"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
				</svg>
			),
			title: "Real-time Alerts",
			description:
				"Instant notifications when stocks hit your precise target thresholds.",
		},
		{
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5 text-primary"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fillRule="evenodd"
						d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
						clipRule="evenodd"
					/>
				</svg>
			),
			title: "Advanced Analysis",
			description:
				"Comprehensive market insights with powerful technical indicators.",
		},
		{
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-5 w-5 text-primary"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
				</svg>
			),
			title: "Portfolio Tracking",
			description:
				"Monitor investments and measure performance with dynamic dashboards.",
		},
	];

	return (
		<div className="space-y-8">
			<Card className="p-8 border border-border bg-card/80 backdrop-blur-sm shadow-md">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<div key={index} className="space-y-3">
							<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
								{feature.icon}
							</div>
							<h3 className="text-md font-semibold text-foreground">
								{feature.title}
							</h3>
							<p className="text-muted-foreground">{feature.description}</p>
						</div>
					))}
				</div>
			</Card>

			{/* Enhanced supporting text */}
			<p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
				Join thousands of investors who rely on Watchdog for timely market
				insights and portfolio management. Our platform is designed for both
				beginners and experienced traders, with powerful tools that simplify
				complex market data.
			</p>
		</div>
	);
};

export default FeatureHighlights;
