import React from "react";

const PageLayout = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="w-full max-w-[1400px] sm:mx-auto">
			<div className="bg-gradient-to-b from-background to-secondary/20">
				{children}
			</div>
		</div>
	);
};

export default PageLayout;
