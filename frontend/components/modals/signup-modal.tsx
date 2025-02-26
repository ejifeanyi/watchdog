"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const Signup = () => {
	const { signup, showSignupModal, closeModals } = useAuth();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await signup(name, email, password);
		} catch (err) {
			setError(
				`Signup failed: ${err instanceof Error ? err.message : String(err)}`
			);
		}
	};

	return (
		<Dialog open={showSignupModal} onOpenChange={closeModals}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Sign Up</DialogTitle>
					<DialogDescription>
						Create a new account.
						{error && <p className="text-red-500">{error}</p>}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<Label htmlFor="name">Full Name</Label>
					<Input
						type="text"
						placeholder="Your Name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Label htmlFor="email">Email</Label>
					<Input
						type="email"
						placeholder="Your Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<Label htmlFor="password">Password</Label>
					<Input
						type="password"
						placeholder="Your Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<Button type="submit">Sign Up</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
};

export default Signup;
