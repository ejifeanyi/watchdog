"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import Login from "./modals/login-modal";
import Signup from "./modals/signup-modal";
import { Bell, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import SearchBar from "./searchbar";

export default function Navbar() {
	const { isAuthenticated, user, logout, openLoginModal, openSignupModal } =
		useAuth();

	const [scrolled, setScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

	// Toggle mobile menu
	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	return (
		<>
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

					{/* Search Bar - Only show for authenticated users */}
					{isAuthenticated && (
						<div className="hidden md:block">
							<SearchBar />
						</div>
					)}

					{/* Mobile menu toggle */}
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={toggleMobileMenu}
					>
						<ChevronDown
							className={`h-5 w-5 transition-transform ${
								isMobileMenuOpen ? "rotate-180" : ""
							}`}
						/>
					</Button>

					{/* Desktop menu */}
					<div className="hidden md:flex items-center space-x-1 lg:space-x-2">
						<Button
							variant="ghost"
							data-watchlist-button="true"
							className="flex items-center gap-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary"
						>
							<Eye className="w-4 h-4" />
							<span>Watchlist</span>
						</Button>

						<Button
							variant="ghost"
							data-alerts-button="true"
							className="flex items-center gap-2 rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary relative"
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

				{/* Mobile menu dropdown */}
				{isMobileMenuOpen && (
					<div className="md:hidden p-4 pt-2 pb-4 border-t border-border/50 bg-background/95 backdrop-blur-md">
						{isAuthenticated && (
							<div className="mb-4">
								<SearchBar />
							</div>
						)}

						<div className="flex flex-col space-y-2">
							<Button
								variant="ghost"
								data-watchlist-button="true"
								className="flex items-center justify-start gap-2 w-full text-sm font-medium"
							>
								<Eye className="w-4 h-4" />
								<span>Watchlist</span>
							</Button>

							<Button
								variant="ghost"
								data-alerts-button="true"
								className="flex items-center justify-start gap-2 w-full text-sm font-medium relative"
							>
								<Bell className="w-4 h-4" />
								<span>Alerts</span>
							</Button>

							<div className="flex items-center justify-between py-2">
								<span className="text-sm text-muted-foreground">Theme</span>
								<ThemeToggle />
							</div>

							{isAuthenticated ? (
								<>
									<div className="flex items-center justify-between py-2">
										<div className="text-sm font-medium">Hi, {user?.name}</div>
										<Button
											variant="outline"
											onClick={logout}
											size="sm"
											className="border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
										>
											Logout
										</Button>
									</div>
								</>
							) : (
								<div className="flex space-x-2 pt-2">
									<Button
										onClick={openLoginModal}
										variant="outline"
										size="sm"
										className="w-full text-sm font-medium"
									>
										Login
									</Button>
									<Button
										onClick={openSignupModal}
										variant="default"
										size="sm"
										className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
									>
										Sign Up
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
			</nav>
			<Login />
			<Signup />
		</>
	);
}
