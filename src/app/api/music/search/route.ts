// File: src/app/api/music/search/route.ts

import { env } from "@/env";
import { type SearchResponse } from "@/types";
import { NextResponse, type NextRequest } from "next/server";

// Force dynamic rendering for search route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");
  const offset = searchParams.get("offset");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter 'q'" },
      { status: 400 },
    );
  }

  try {
    // Use NEXT_PUBLIC_API_URL directly as the backend API URL
    const backendUrl = env.NEXT_PUBLIC_API_URL;
    
    if (!backendUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_URL not configured" },
        { status: 500 },
      );
    }

    // Normalize URL to avoid double slashes (backendUrl has trailing slash)
    const normalizedBackendUrl = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
    const url = new URL("music/search", normalizedBackendUrl);
    url.searchParams.set("q", query);
    if (offset != null) {
      url.searchParams.set("offset", offset);
    }

    console.log("[Music Search API] Fetching from:", url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
      // Add timeout
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(
        "[Music Search API] Backend returned error:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `Backend API error: ${response.status}` },
        { status: response.status },
      );
    }

    // Explicitly type data as unknown and validate structure
    const data: unknown = await response.json();

    // Validate that the response matches SearchResponse structure
    // Required: data (array), total (number)
    // Optional: next (string)
    if (
      typeof data === "object" &&
      data !== null &&
      "data" in data &&
      Array.isArray((data as Record<string, unknown>).data) &&
      "total" in data &&
      typeof (data as Record<string, unknown>).total === "number"
    ) {
      const responseData = data as {
        data: unknown[];
        total: number;
        next?: string;
      };

      // Construct validated response with proper typing
      // Note: We trust the backend to return valid Track[] in data array
      // Full Track validation would require checking each item, which is expensive
      const validatedResponse: SearchResponse = {
        data: responseData.data as SearchResponse["data"],
        total: responseData.total,
        ...(responseData.next && { next: responseData.next }),
      };
      return NextResponse.json(validatedResponse);
    } else {
      console.error(
        "[Music Search API] Invalid response structure from backend:",
        data,
      );
      return NextResponse.json(
        {
          error: "Invalid response from backend API: missing required fields (data: Track[], total: number)",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[Music Search API] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Search failed: ${errorMessage}` },
      { status: 500 },
    );
  }
}
