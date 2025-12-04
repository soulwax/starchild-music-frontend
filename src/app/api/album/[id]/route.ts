// File: src/app/api/album/[id]/route.ts

import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const albumId = parseInt(id, 10);

  if (isNaN(albumId)) {
    return NextResponse.json({ error: "Invalid album ID" }, { status: 400 });
  }

  try {
    // Proxy the request to Deezer API
    const deezerUrl = `https://api.deezer.com/album/${albumId}`;
    console.log(
      `[Album API] Fetching album info for ${albumId} from: ${deezerUrl}`,
    );

    const response = await fetch(deezerUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[Album API] Deezer API error: ${response.status} ${response.statusText}`,
        errorText,
      );
      return NextResponse.json(
        { error: `Deezer API error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      title?: string;
      [key: string]: unknown;
    };
    console.log(`[Album API] Successfully fetched album info for ${albumId}`);

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[Album API] Error fetching album info:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("timeout"));

    return NextResponse.json(
      {
        error: "Failed to fetch album info",
        message: errorMessage,
        type: isTimeout ? "timeout" : "fetch_error",
      },
      { status: 500 },
    );
  }
}
