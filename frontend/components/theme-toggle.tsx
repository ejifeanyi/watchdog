"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button"; // assuming you're using shadcn/ui

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	// Add this to prevent hydration mismatch
	const [mounted, setMounted] = useState(false);

	// Only show the toggle once mounted on the client
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		// Return a placeholder with the same dimensions to prevent layout shift
		return (
			<Button variant="ghost" size="icon" disabled>
				<div className="w-5 h-5" />
			</Button>
		);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
		>
			{theme === "dark" ? (
				<Sun className="w-5 h-5" />
			) : (
				<Moon className="w-5 h-5" />
			)}
		</Button>
	);
}
