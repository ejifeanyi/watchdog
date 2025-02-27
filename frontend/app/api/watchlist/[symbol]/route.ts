// app/api/watchlist/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Call your backend API
		const response = await fetch(`${process.env.API_URL}/watchlist`, {
			headers: {
				// Pass along authentication token
				Authorization: request.headers.get("Authorization") || "",
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to fetch watchlist");
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Watchlist fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch watchlist" },
			{ status: 500 }
		);
	}
}

// app/api/watchlist/add/route.ts
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Call your backend API
		const response = await fetch(`${process.env.API_URL}/watchlist/add`, {
			method: "POST",
			headers: {
				Authorization: request.headers.get("Authorization") || "",
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to add to watchlist");
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Watchlist add error:", error);
		return NextResponse.json(
			{ error: "Failed to add to watchlist" },
			{ status: 500 }
		);
	}
}

// app/api/watchlist/[symbol]/route.ts
export async function DELETE(
	request: NextRequest,
	{ params }: { params: { symbol: string } }
) {
	try {
		const { symbol } = params;

		// Call your backend API
		const response = await fetch(`${process.env.API_URL}/watchlist/${symbol}`, {
			method: "DELETE",
			headers: {
				Authorization: request.headers.get("Authorization") || "",
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to remove from watchlist");
		}

		return NextResponse.json({ message: "Stock removed" });
	} catch (error) {
		console.error("Watchlist remove error:", error);
		return NextResponse.json(
			{ error: "Failed to remove from watchlist" },
			{ status: 500 }
		);
	}
}
