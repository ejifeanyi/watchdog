import { AuthProvider } from "@/context/auth-context";
import { StocksProvider } from "@/context/stocks-context";
import { ThemeProvider } from "next-themes";
import ToastProvider from "./ToastProvider";
import { AlertProvider } from "@/context/alert-context";
import PageLayout from "@/components/page-layout";
import Navbar from "@/components/navbar";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<AuthProvider>
				<StocksProvider>
					<AlertProvider>
						<ToastProvider>
							<PageLayout>
								<Navbar />
								{children}
							</PageLayout>
						</ToastProvider>
					</AlertProvider>
				</StocksProvider>
			</AuthProvider>
		</ThemeProvider>
	);
}
