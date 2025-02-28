"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useStocks } from "@/context/stocks-context";

const SearchBar: React.FC = () => {
	const {
		searchQuery,
		setSearchQuery,
		handleSearch,
		clearSearch,
		isSearching,
	} = useStocks();

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
	};

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleSearch(searchQuery);
		}
	};

	const handleSearchClick = () => {
		if (searchQuery.trim()) {
			handleSearch(searchQuery);
		}
	};

	return (
		<div className="relative w-full max-w-xs lg:max-w-md mx-4">
			<div className="relative">
				<Input
					type="text"
					placeholder="Search for stocks..."
					value={searchQuery}
					onChange={handleInputChange}
					onKeyPress={handleKeyPress}
					className="w-full pr-8 pl-9 bg-secondary/50 border-secondary focus:bg-background"
					disabled={isSearching}
				/>
				<Search
					size={16}
					className={`absolute left-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${
						isSearching ? "animate-pulse text-primary" : "text-muted-foreground"
					}`}
					onClick={handleSearchClick}
				/>
				{searchQuery && (
					<button
						className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
						onClick={clearSearch}
						disabled={isSearching}
						type="button"
						aria-label="Clear search"
					>
						<X size={14} />
					</button>
				)}
			</div>
		</div>
	);
};

export default SearchBar;
