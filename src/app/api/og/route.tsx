// File: src/app/api/og/route.tsx

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title");
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");
  const cover = searchParams.get("cover");

  // Default: Show Emily the Strange
  if (!title || !artist) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0b1118",
            backgroundImage:
              "radial-gradient(circle at 25% 25%, rgba(244, 178, 102, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(88, 198, 177, 0.1) 0%, transparent 50%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Emily the Strange placeholder - we'll show logo/text instead since we can't easily load the image in edge runtime */}
            <div
              style={{
                fontSize: 120,
                fontWeight: 700,
                color: "#f5f1e8",
                marginBottom: 40,
                textAlign: "center",
                letterSpacing: "-0.05em",
              }}
            >
              darkfloor.art
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#a5afbf",
                textAlign: "center",
                maxWidth: 800,
                lineHeight: 1.4,
              }}
            >
              Modern music streaming and discovery platform with smart
              recommendations
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // Dynamic: Show album art with track info
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#0b1118",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(244, 178, 102, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(88, 198, 177, 0.1) 0%, transparent 50%)",
          padding: "80px",
        }}
      >
        {/* Album Art - Square, Left Side */}
        <div
          style={{
            display: "flex",
            width: 470,
            height: 470,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            marginRight: 60,
          }}
        >
          {cover ? (
            <img
              src={cover}
              width={470}
              height={470}
              style={{
                objectFit: "cover",
              }}
              alt="Album cover"
            />
          ) : (
            <div
              style={{
                width: 470,
                height: 470,
                background: "linear-gradient(135deg, #1a2332 0%, #0b1118 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 180,
                color: "#2a3645",
              }}
            >
              ♪
            </div>
          )}
        </div>

        {/* Track Info - Right Side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            maxWidth: 590,
          }}
        >
          {/* Track Title */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#f5f1e8",
              marginBottom: 20,
              lineHeight: 1.1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>

          {/* Artist */}
          <div
            style={{
              fontSize: 40,
              color: "#a5afbf",
              marginBottom: 16,
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {artist}
          </div>

          {/* Album */}
          {album && (
            <div
              style={{
                fontSize: 32,
                color: "#6b7688",
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {album}
            </div>
          )}

          {/* Branding */}
          <div
            style={{
              fontSize: 24,
              color: "#f4b266",
              marginTop: 40,
              fontWeight: 600,
            }}
          >
            darkfloor.art
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
