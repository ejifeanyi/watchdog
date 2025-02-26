"use client";

import Link from "next/link";
import { Bell, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Login from "./modals/login-modal";
import Signup from "./modals/signup-modal";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export default function Navbar() {
	const { isAuthenticated, user, logout, openLoginModal, openSignupModal } =
		useAuth();

	const [scrolled, setScrolled] = useState(false);

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 10;
			if (isScrolled !== scrolled) {
				setScrolled(isScrolled);
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [scrolled]);

	return (
		<nav
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
				scrolled
					? "py-2 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"
					: "py-4 bg-background/80 backdrop-blur-sm"
			}`}
		>
			<div className="w-full max-w-[1400px] flex items-center justify-between px-4 md:px-6 mx-auto">
				{/* Logo */}
				<Link
					href="/"
					className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
				>
					Watchdog
				</Link>

				{/* Mobile menu - hidden on larger screens */}
				<Button variant="ghost" size="icon" className="md:hidden">
					<ChevronDown className="h-5 w-5" />
				</Button>

				{/* Desktop menu */}
				<div className="hidden md:flex items-center space-x-1 lg:space-x-2">
					<Button
						variant="ghost"
						className="flex items-center gap-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary"
					>
						<Eye className="w-4 h-4" />
						<span>Watchlist</span>
					</Button>

					<Button
						variant="ghost"
						className="flex items-center gap-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary"
					>
						<Bell className="w-4 h-4" />
						<span>Alerts</span>
					</Button>

					<div className="h-6 w-px bg-border mx-1"></div>

					<ThemeToggle />

					{isAuthenticated ? (
						<>
							<div className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
								Hi, {user?.name}
							</div>
							<Button
								variant="outline"
								onClick={logout}
								size="sm"
								className="border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
							>
								Logout
							</Button>
						</>
					) : (
						<>
							<Button
								onClick={openLoginModal}
								variant="ghost"
								size="sm"
								className="text-sm font-medium"
							>
								Login
							</Button>
							<Button
								onClick={openSignupModal}
								variant="default"
								size="sm"
								className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
							>
								Sign Up
							</Button>
						</>
					)}
				</div>
			</div>
			<Login />
			<Signup />
		</nav>
	);
}
