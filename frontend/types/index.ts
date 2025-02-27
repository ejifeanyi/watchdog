// types/index.ts
export interface Stock {
	symbol: string;
	price?: number;
	volume?: number;
	change?: number;
	changePercent?: string;
	name?: string;
}

export interface SearchHandlers {
	onSearch: (query: string) => void;
	onClear: () => void;
}

export interface StocksDashboardHandlers {
	handleSearchResults: (results: Stock[]) => void;
	clearSearch: () => void;
}

// Extend Window interface to avoid TypeScript errors with global property
declare global {
	interface Window {
		stocksDashboard?: StocksDashboardHandlers;
	}
}
