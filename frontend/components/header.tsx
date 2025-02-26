"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HeroHeader() {
	return (
		<header className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background to-secondary/20">
			<div className="max-w-5xl mx-auto px-6 text-center">
				{/* New: Subtle badge above headline */}
				<Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/15 border-none">
					Intelligent Market Monitoring
				</Badge>

				<div className="space-y-8">
					{/* Main Headline */}
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mx-auto">
						<span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
							Financial intelligence that works while you sleep
						</span>
					</h1>

					{/* Improved Subheading */}
					<p className="text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto">
						Watchdog monitors market movements 24/7 so you never miss critical
						trading opportunities.
					</p>

					{/* Decorative element */}
					<div className="flex justify-center">
						<div className="w-16 h-1 bg-primary/50 rounded-full"></div>
					</div>

					{/* Feature highlights in an enhanced card */}
					<Card className="p-8 border border-border bg-card/80 backdrop-blur-sm shadow-md">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
							<div className="space-y-3">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-primary"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-foreground">
									Real-time Alerts
								</h3>
								<p className="text-muted-foreground">
									Instant notifications when stocks hit your precise target
									thresholds.
								</p>
							</div>

							<div className="space-y-3">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
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
								</div>
								<h3 className="text-lg font-semibold text-foreground">
									Advanced Analysis
								</h3>
								<p className="text-muted-foreground">
									Comprehensive market insights with powerful technical
									indicators.
								</p>
							</div>

							<div className="space-y-3">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 text-primary"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-foreground">
									Portfolio Tracking
								</h3>
								<p className="text-muted-foreground">
									Monitor investments and measure performance with dynamic
									dashboards.
								</p>
							</div>
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
			</div>
		</header>
	);
}
