"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
	useCallback,
} from "react";
import axios from "axios";
import { Stock } from "@/types";

interface RawStockData {
  symbol: string;
  name?: string;
  price?: number;
  volume?: number;
  change?: number;
  changePercent?: number;
}

// Make sure the API_BASE_URL points to your backend
const API_BASE_URL = "http://localhost:5000"; // Update this to your backend URL

interface StocksContextType {
	// Trending stocks
	trendingStocks: Stock[];
	loadingTrending: boolean;
	trendingError: string | null;
	fetchTrendingStocks: () => Promise<void>;

	// Search functionality
	searchQuery: string;
	searchResults: Stock[];
	isSearching: boolean;
	searchError: string | null;
	setSearchQuery: (query: string) => void;
	handleSearch: (query: string) => Promise<void>;
	clearSearch: () => void;
	getStockBySymbol: (symbol: string) => Stock | undefined;
}

const StocksContext = createContext<StocksContextType | null>(null);

export const StocksProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	// Trending stocks state
	const [trendingStocks, setTrendingStocks] = useState<Stock[]>([]);
	const [loadingTrending, setLoadingTrending] = useState<boolean>(true);
	const [trendingError, setTrendingError] = useState<string | null>(null);

	// Search state
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [searchResults, setSearchResults] = useState<Stock[]>([]);
	const [isSearching, setIsSearching] = useState<boolean>(false);
	const [searchError, setSearchError] = useState<string | null>(null);

	// Fetch trending stocks
	const fetchTrendingStocks = React.useCallback(async (): Promise<void> => {
		setLoadingTrending(true);
		setTrendingError(null);

		try {
			console.log("📊 Fetching trending stocks...");
			const response = await axios.get<Stock[]>(
				`${API_BASE_URL}/api/stocks/trending`
			);
			console.log("📊 Trending stocks response:", response.data);
			setTrendingStocks(response.data);
		} catch (err) {
			console.error("❌ Error fetching trending stocks:", err);
			setTrendingError(
				"Failed to load trending stocks. Please try again later."
			);
			setTrendingStocks([]);
		} finally {
			setLoadingTrending(false);
		}
	}, []); // Empty dependency array because it doesn't depend on any props or state

	// Handle search
	const handleSearch = async (query: string): Promise<void> => {
		if (!query.trim()) {
			clearSearch();
			return;
		}

		setIsSearching(true);
		setSearchError(null);

		try {
			const response = await axios.get(`${API_BASE_URL}/api/stocks/search`, {
				params: { query },
			});

			console.log(`🔍 Search results:`, response.data);

			// Transform search results to match the Stock type
			// Note that search results may not have all the data that trending stocks have
			const formattedResults = response.data.map((stock: RawStockData) => ({
				symbol: stock.symbol,
				name: stock.name || "",
				price: stock.price || null,
				volume: stock.volume || null,
				change: stock.change || null,
				changePercent: stock.changePercent || null,
			}));

			setSearchResults(formattedResults);
		} catch (err) {
			console.error("❌ Error searching stocks:", err);
			setSearchError("Failed to search stocks. Please try again later.");
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};

	// Clear search
	const clearSearch = (): void => {
		setSearchQuery("");
		setSearchResults([]);
		setIsSearching(false);
		setSearchError(null);
	};

	// Load trending stocks on initial render
	useEffect(() => {
		console.log("🚀 StocksProvider mounted, fetching trending stocks...");
		fetchTrendingStocks();
	}, [fetchTrendingStocks]); // Now we can safely add fetchTrendingStocks as a dependency

	const getStockBySymbol = useCallback(
		(symbol: string): Stock | undefined => {
			const allStocks = [...trendingStocks, ...searchResults];
			return allStocks.find((stock) => stock.symbol === symbol);
		},
		[trendingStocks, searchResults]
	);

	return (
		<StocksContext.Provider
			value={{
				// Trending stocks
				trendingStocks,
				loadingTrending,
				trendingError,
				fetchTrendingStocks,

				// Search functionality
				searchQuery,
				searchResults,
				isSearching,
				searchError,
				setSearchQuery,
				handleSearch,
				clearSearch,

				getStockBySymbol,
			}}
		>
			{children}
		</StocksContext.Provider>
	);
};

// Custom hook to use the stocks context
export const useStocks = (): StocksContextType => {
	const context = useContext(StocksContext);
	if (!context) {
		throw new Error("useStocks must be used within a StocksProvider");
	}
	return context;
};
