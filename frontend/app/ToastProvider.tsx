"use client";

import React from "react";
import { Toaster } from "sonner";

interface ToastProviderProps {
	children: React.ReactNode;
}

export default function ToastProvider({ children }: ToastProviderProps) {
	return (
		<>
			{children}
			<Toaster
				position="top-right"
				closeButton
				richColors
				toastOptions={{
					duration: 3000,
					className: "rounded-md",
				}}
			/>
		</>
	);
}
