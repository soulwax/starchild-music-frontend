// File: src/app/api/music/search/route.ts

import { env } from "@/env";
import { type SearchResponse } from "@/types";
import { NextResponse, type NextRequest } from "next/server";

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

    const backendUrl = env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_API_URL not configured" },
        { status: 500 },
      );
    }

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

      signal: AbortSignal.timeout(30000),
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

    const data: unknown = await response.json();

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
