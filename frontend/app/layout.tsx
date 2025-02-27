import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import Navbar from "@/components/navbar";
import PageLayout from "@/components/page-layout";
import { StocksProvider } from "@/context/stocks-context";
import ToastProvider from "./ToastProvider";

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
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<StocksProvider>
							<ToastProvider>
								<PageLayout>
									<Navbar />
									<main className="container py-6">{children}</main>
								</PageLayout>
							</ToastProvider>
						</StocksProvider>
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
