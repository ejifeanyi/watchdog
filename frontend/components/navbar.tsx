"use client";

import Link from "next/link";
import { Bell, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Login from "./modals/login-modal";
import Signup from "./modals/signup-modal";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
	const { isAuthenticated, user, logout, openLoginModal, openSignupModal } =
		useAuth();

	return (
		<nav className="py-4 bg-background border-b/50 background-blur-md">
			<div className="w-full max-w-[1400px] flex items-center justify-between px-4 mx-auto">
				{/* Logo */}
				<Link href="/" className="text-md font-semibold">
					Watchdog
				</Link>

				<div className="flex items-center space-x-4">
					<Button variant="ghost" className="flex items-center gap-2">
						<Eye className="w-5 h-5" />
						<span>Watchlist</span>
					</Button>

					<Button variant="ghost" className="flex items-center gap-2">
						<Bell className="w-5 h-5" />
						<span>Alerts</span>
					</Button>

					<ThemeToggle />

					{isAuthenticated ? (
						<>
							<span className="text-sm font-medium">Hi, {user?.name}</span>
							<Button variant="outline" onClick={logout}>
								Logout
							</Button>
						</>
					) : (
						<>
							<Button onClick={openLoginModal} variant="ghost">
								Login
							</Button>
							<Button onClick={openSignupModal} variant="default">
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
