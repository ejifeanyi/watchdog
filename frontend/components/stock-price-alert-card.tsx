"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RealTimePrice } from "./realtime-price";

interface StockCardProps {
	symbol: string;
	name: string;
	initialPrice?: number;
}

export function StockCard({ symbol, name, initialPrice }: StockCardProps) {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="pb-2">
				<CardTitle className="text-xl flex items-center justify-between">
					<span>{symbol}</span>
					<RealTimePrice symbol={symbol} initialPrice={initialPrice} />
				</CardTitle>
				<p className="text-sm text-muted-foreground">{name}</p>
			</CardHeader>
			<CardContent>
				{/* You can add charts or other details here */}
			</CardContent>
		</Card>
	);
}
