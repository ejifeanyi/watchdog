"use client";

import { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

// Shared input component for consistent styling
const AuthInput = ({
	icon,
	label,
	type,
	value,
	onChange,
	placeholder,
	error,
	autoFocus = false,
	isPassword = false,
}: {
	icon: React.ReactNode;
	label: string;
	type: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	placeholder?: string;
	error?: string;
	autoFocus?: boolean;
	isPassword?: boolean;
}) => {
	const [showPassword, setShowPassword] = useState(false);

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium flex items-center gap-1.5">
				{icon}
				{label}
			</Label>
			<div className="relative">
				<Input
					type={isPassword ? (showPassword ? "text" : "password") : type}
					value={value}
					onChange={onChange}
					required
					className={cn(
						"pl-3 pr-10 py-2 h-10 bg-background border-input",
						error && "border-destructive focus-visible:ring-destructive"
					)}
					placeholder={placeholder}
					autoFocus={autoFocus}
				/>
				{isPassword && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
						onClick={togglePasswordVisibility}
						tabIndex={-1} // Skip in tab order
					>
						{showPassword ? (
							<EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
						) : (
							<Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
						)}
						<span className="sr-only">
							{showPassword ? "Hide password" : "Show password"}
						</span>
					</Button>
				)}
			</div>
			{error && (
				<p className="text-xs text-destructive flex items-center gap-1">
					<AlertCircle className="h-3 w-3" />
					{error}
				</p>
			)}
		</div>
	);
};

export default AuthInput;
