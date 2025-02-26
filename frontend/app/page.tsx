import Navbar from "@/components/navbar";
import PageLayout from "@/components/page-layout";

export default function Home() {
	return (
		<main className="min-h-screen flex flex-col">
			<Navbar />

			<PageLayout>
				<div className="py-8">
					<h1 className="text-3xl font-bold mb-4">Welcome to Watchdog</h1>
					<p className="text-muted-foreground">
						Your personal stock monitoring assistant. Track your investments,
						set alerts, and stay informed about market movements.
					</p>

					{/* Add more content here */}
				</div>
			</PageLayout>
		</main>
	);
}
