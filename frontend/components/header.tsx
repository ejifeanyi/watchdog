"use client";

import { Badge } from "@/components/ui/badge";
import FeatureHighlights from "./feature-highlights";

export default function HeroHeader() {
	return (
		<header className="w-full py-16 md:py-24 lg:py-32">
			<div className="max-w-5xl mx-auto px-6 text-center">
				{/* New: Subtle badge above headline */}
				<Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/15 border-none">
					Intelligent Market Monitoring
				</Badge>

				<div className="space-y-8">
					{/* Main Headline */}
					<h1 className="text-3xl sm:4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mx-auto">
						<span className="bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
							Financial intelligence that works while you sleep
						</span>
					</h1>

					{/* Improved Subheading */}
					<p className="text-md sm:lg md:text-xl font-medium text-muted-foreground max-w-3xl mx-auto">
						Watchdog monitors market movements 24/7 so you never miss critical
						trading opportunities.
					</p>

					{/* Decorative element */}
					<div className="flex justify-center">
						<div className="w-16 h-1 bg-primary/50 rounded-full"></div>
					</div>

					{/* Feature highlights in an enhanced card */}
					<FeatureHighlights />
				</div>
			</div>
		</header>
	);
}
