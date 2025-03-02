// app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	try {
		// Call your backend API
		const response = await fetch(`${process.env.API_URL}/alerts`, {
			headers: {
				// Pass along authentication token
				Authorization: request.headers.get("Authorization") || "",
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to fetch alerts");
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Alerts fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch alerts" },
			{ status: 500 }
		);
	}
}

// app/api/alerts/[id]/route.ts
export async function DELETE(
	request: NextRequest,
	context: { params: Record<string, string> } // Ensures compatibility with Next.js 15+
) {
	try {
		const id = context.params.id; // Correct access to `id`

		const response = await fetch(`${process.env.API_URL}/alerts/${id}`, {
			method: "DELETE",
			headers: {
				Authorization: request.headers.get("Authorization") || "",
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to remove alert");
		}

		return NextResponse.json({ message: "Alert removed" });
	} catch (error) {
		console.error("Alert remove error:", error);
		return NextResponse.json(
			{ error: "Failed to remove alert" },
			{ status: 500 }
		);
	}
}
