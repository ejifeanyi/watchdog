// components/page-layout.tsx
import React from "react";

interface PageLayoutProps {
	children: React.ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
	return (
		<div className="w-full max-w-[1400px] sm:mx-auto">
			<div className="bg-gradient-to-b from-background to-secondary/20">
				{children}
			</div>
		</div>
	);
};

export default PageLayout;
