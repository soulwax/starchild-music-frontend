// File: src/app/api/artist/[id]/route.ts

import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const artistId = parseInt(id, 10);

  if (isNaN(artistId)) {
    return NextResponse.json({ error: "Invalid artist ID" }, { status: 400 });
  }

  try {

    const deezerUrl = `https://api.deezer.com/artist/${artistId}`;
    console.log(
      `[Artist API] Fetching artist info for ${artistId} from: ${deezerUrl}`,
    );

    const response = await fetch(deezerUrl, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[Artist API] Deezer API error: ${response.status} ${response.statusText}`,
        errorText,
      );
      return NextResponse.json(
        { error: `Deezer API error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      id?: number;
      name?: string;
      picture?: string;
      picture_small?: string;
      picture_medium?: string;
      picture_big?: string;
      picture_xl?: string;
      nb_album?: number;
      nb_fan?: number;
      [key: string]: unknown;
    };
    console.log(`[Artist API] Successfully fetched artist info for ${artistId}`);

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("[Artist API] Error fetching artist info:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch artist information",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
