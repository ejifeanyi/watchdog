import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import Providers from "./Providers";

const poppins = Poppins({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-poppins",
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: "watchdog",
	description: "A simple watchdog for your stocks",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${poppins.variable} font-sans antialiased`}>
				<Providers>
					<main className="container py-6">{children}</main>
				</Providers>
			</body>
		</html>
	);
}
