"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
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
import {
	Mail,
	Lock,
	User,
	AlertCircle,
	Loader2,
	ArrowRight,
} from "lucide-react";
import AuthInput from "../auth-input";

const Signup = () => {
	const { signup, showSignupModal, closeModals, openLoginModal } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [errors, setErrors] = useState<{
		name?: string;
		email?: string;
		password?: string;
		confirmPassword?: string;
		general?: string;
	}>({});
	const [isLoading, setIsLoading] = useState(false);

	const validateForm = () => {
		const newErrors: {
			name?: string;
			email?: string;
			password?: string;
			confirmPassword?: string;
		} = {};

		if (!name.trim()) {
			newErrors.name = "Name is required";
		}

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

		if (password !== confirmPassword) {
			newErrors.confirmPassword = "Passwords don't match";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsLoading(true);
		try {
			await signup(name, email, password);
			// Clear form after successful signup
			setName("");
			setEmail("");
			setPassword("");
			setConfirmPassword("");
			setErrors({});
		} catch (err) {
			setErrors({
				general: `Signup failed: ${
					err instanceof Error ? err.message : String(err)
				}`,
			});
		} finally {
			setIsLoading(false);
		}
	};

	const switchToLogin = () => {
		closeModals();
		setTimeout(() => {
			openLoginModal();
		}, 100);
	};

	return (
		<Dialog open={showSignupModal} onOpenChange={closeModals}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="space-y-3">
					<DialogTitle className="text-2xl font-bold text-foreground">
						Create an account
					</DialogTitle>
					<DialogDescription className="text-muted-foreground">
						Join Watchdog to start monitoring your investments and receive
						custom alerts.
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
						icon={<User className="h-4 w-4 text-muted-foreground" />}
						label="Full Name"
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="John Doe"
						error={errors.name}
						autoFocus
					/>

					<AuthInput
						icon={<Mail className="h-4 w-4 text-muted-foreground" />}
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
						error={errors.email}
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

					<AuthInput
						icon={<Lock className="h-4 w-4 text-muted-foreground" />}
						label="Confirm Password"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="••••••••"
						error={errors.confirmPassword}
						isPassword={true}
					/>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating account...
							</>
						) : (
							"Sign up"
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
								Already have an account?
							</span>
						</div>
					</div>

					<Button
						type="button"
						variant="outline"
						className="w-full"
						onClick={switchToLogin}
					>
						Log in instead
						<ArrowRight className="ml-2 h-4 w-4" />
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default Signup;
