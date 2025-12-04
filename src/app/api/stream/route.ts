// File: src/app/api/stream/route.ts

import { env } from "@/env";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("q");
  const id = searchParams.get("id");

  if (!query && !id) {
    return NextResponse.json(
      { error: "Missing query or id parameter" },
      { status: 400 },
    );
  }

  try {
    const apiUrl = env.NEXT_PUBLIC_API_URL as string | undefined;
    if (!apiUrl) {
      console.error("[Stream API] NEXT_PUBLIC_API_URL not configured");
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const streamingKey = env.STREAMING_KEY;
    if (!streamingKey) {
      console.error("[Stream API] STREAMING_KEY not configured");
      return NextResponse.json(
        { error: "Streaming key not configured" },
        { status: 500 },
      );
    }

    const url = new URL("music/stream", apiUrl);
    url.searchParams.set("key", streamingKey);

    // Prioritize ID over query - ID is more specific and accurate
    if (id) {
      url.searchParams.set("id", id);
      console.log("[Stream API] Streaming by ID:", id);
    } else if (query) {
      url.searchParams.set("q", query);
      console.log("[Stream API] Streaming by query:", query);
    }

    const requestUrl = url.toString();
    console.log(
      "[Stream API] Fetching stream from:",
      requestUrl.replace(streamingKey, "***"),
    );
    console.log(
      "[Stream API] Full URL (key hidden):",
      requestUrl.replace(streamingKey, "***"),
    );

    const response = await fetch(requestUrl, {
      headers: {
        Range: req.headers.get("Range") ?? "",
      },
      // Add timeout and better error handling
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Could not read error response");
      let errorData: { message?: string; error?: string } = {
        message: errorText,
      };
      try {
        errorData = JSON.parse(errorText) as {
          message?: string;
          error?: string;
        };
      } catch {
        errorData = { message: errorText };
      }

      console.error(
        `[Stream API] Stream failed: ${response.status} ${response.statusText}`,
      );
      console.error("[Stream API] Error details:", errorData);
      console.error(
        "[Stream API] Response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      // Check for specific upstream error
      const isUpstreamError =
        (errorData.message?.includes("upstream error") ?? false) ||
        errorData.error === "ServiceUnavailableException";

      return NextResponse.json(
        {
          error: isUpstreamError
            ? "Upstream service unavailable"
            : `Stream failed: ${response.statusText}`,
          message: errorData.message ?? errorText,
          details: errorData,
          status: response.status,
          backendUrl: requestUrl.replace(streamingKey, "***"),
          type: isUpstreamError ? "upstream_error" : "stream_error",
        },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");
    const contentRange = response.headers.get("content-range");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    };

    if (contentLength) headers["Content-Length"] = contentLength;
    if (acceptRanges) headers["Accept-Ranges"] = acceptRanges;
    if (contentRange) headers["Content-Range"] = contentRange;

    // Stream directly instead of buffering
    return new NextResponse(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[Stream API] Streaming error:", error);

    // Check if it's a timeout or network error
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        console.error(
          "[Stream API] Request timed out - backend may be unresponsive",
        );
        return NextResponse.json(
          {
            error: "Backend request timed out",
            message:
              "The backend server did not respond in time. Check if the backend is running and accessible.",
            type: "timeout",
          },
          { status: 504 },
        );
      }

      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        console.error(
          "[Stream API] Connection refused - backend may not be running or URL is incorrect",
        );
        return NextResponse.json(
          {
            error: "Cannot connect to backend",
            message: `Failed to connect to backend at ${env.NEXT_PUBLIC_API_URL}. Check if the backend is running.`,
            type: "connection_error",
            backendUrl: env.NEXT_PUBLIC_API_URL,
          },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch stream",
        message: error instanceof Error ? error.message : "Unknown error",
        type: "unknown_error",
      },
      { status: 500 },
    );
  }
}
