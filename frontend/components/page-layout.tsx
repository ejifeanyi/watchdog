import React from 'react'

const PageLayout = ({
	children,
}: {
	children: React.ReactNode;
}) => {
    return <div className="w-full max-w-[1400px] sm:mx-auto">{children}</div>;
}

export default PageLayout
