import HeroHeader from "@/components/header";
import Navbar from "@/components/navbar";
import PageLayout from "@/components/page-layout";

export default function Home() {
	return (
		<main className="min-h-screen flex flex-col">
			<Navbar />

			<PageLayout>
				<div className="py-8">
					<HeroHeader />

					{/* Add more content here */}
				</div>
			</PageLayout>
		</main>
	);
}
