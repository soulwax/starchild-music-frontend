// File: src/app/api/artist/[id]/tracks/route.ts

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

    const deezerUrl = `https://api.deezer.com/artist/${artistId}/top?limit=50`;
    console.log(
      `[Artist Tracks API] Fetching tracks for artist ${artistId} from: ${deezerUrl}`,
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
        `[Artist Tracks API] Deezer API error: ${response.status} ${response.statusText}`,
        errorText,
      );
      return NextResponse.json(
        {
          error: `Deezer API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      data: unknown[];
      total?: number;
    };
    console.log(
      `[Artist Tracks API] Successfully fetched ${data.data?.length ?? 0} tracks for artist ${artistId}`,
    );

    return NextResponse.json(
      {
        data: data.data || [],
        total: data.total ?? data.data?.length ?? 0,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  } catch (error) {
    console.error("[Artist Tracks API] Error fetching artist tracks:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch artist tracks",
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
