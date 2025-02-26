"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const Login = () => {
	const { login, showLoginModal, closeModals } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await login(email, password);
		} catch {
			setError("Invalid email or password");
		}
	};

	return (
		<Dialog open={showLoginModal} onOpenChange={closeModals}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Login</DialogTitle>
					<DialogDescription>
						Enter your email and password to log in.
						{error && <p className="text-red-500">{error}</p>}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Label>Email</Label>
					<Input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>

					<Label>Password</Label>
					<Input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>

					<Button type="submit">Login</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default Login;
