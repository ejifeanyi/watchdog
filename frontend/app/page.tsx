// app/page.tsx
"use client";

import React from "react";
import { AuthProvider } from "@/context/auth-context";
import HeroHeader from "@/components/header";

export default function HomePage() {
	return (
		<AuthProvider>
			<HeroHeader />
		</AuthProvider>
	);
}
