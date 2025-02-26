"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import AuthInput from "../auth-input";

const Login = () => {
	const { login, showLoginModal, closeModals, openSignupModal } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<{
		email?: string;
		password?: string;
		general?: string;
	}>({});
	const [isLoading, setIsLoading] = useState(false);

	const validateForm = () => {
		const newErrors: { email?: string; password?: string } = {};

		if (!email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = "Please enter a valid email";
		}

		if (!password) {
			newErrors.password = "Password is required";
		} else if (password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsLoading(true);
		try {
			await login(email, password);
			// Clear form after successful login
			setEmail("");
			setPassword("");
			setErrors({});
		} catch {
			setErrors({
				general: "Invalid email or password. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const switchToSignup = () => {
		closeModals();
		setTimeout(() => {
			openSignupModal();
		}, 100);
	};

	return (
		<Dialog open={showLoginModal} onOpenChange={closeModals}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-3">
					<DialogTitle className="text-2xl font-bold text-foreground">
						Welcome back
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Log in to your account to access your watchlists and alerts.
					</DialogDescription>
				</DialogHeader>

				{errors.general && (
					<Card className="bg-destructive/10 border-destructive/20">
						<CardContent className="p-3 text-sm flex items-center gap-2 text-destructive">
							<AlertCircle className="h-4 w-4" />
							{errors.general}
						</CardContent>
					</Card>
				)}

				<form onSubmit={handleSubmit} className="space-y-4 py-2">
					<AuthInput
						icon={<Mail className="h-4 w-4 text-muted-foreground" />}
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						error={errors.email}
						autoFocus
					/>

					<AuthInput
						icon={<Lock className="h-4 w-4 text-muted-foreground" />}
						label="Password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="••••••••"
						error={errors.password}
						isPassword={true}
					/>

					<div className="flex justify-end">
						<Button
							type="button"
							variant="link"
							className="text-xs h-auto p-0 text-primary"
							onClick={() =>
								alert("Password reset functionality would go here")
							}
						>
							Forgot password?
						</Button>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Logging in...
							</>
						) : (
							"Log in"
						)}
					</Button>
				</form>

				<DialogFooter className="flex flex-col sm:flex-col gap-2 mt-2">
					<div className="relative w-full">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t border-border"></span>
						</div>
						<div className="relative flex justify-center text-xs">
							<span className="bg-background px-2 text-muted-foreground">
								Don&apos;t have an account?
							</span>
						</div>
					</div>

					<Button
						type="button"
						variant="outline"
						className="w-full"
						onClick={switchToSignup}
					>
						Create an account
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default Login;
