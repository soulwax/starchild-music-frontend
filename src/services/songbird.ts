// File: src/services/songbird.ts

import { env } from "@/env";

const SONGBIRD_API_URL = env.NEXT_PUBLIC_SONGBIRD_API_URL;
const SONGBIRD_API_KEY = env.SONGBIRD_API_KEY;

async function songbirdRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (!SONGBIRD_API_URL) {
    throw new Error(
      "Songbird API URL is not configured. Set NEXT_PUBLIC_SONGBIRD_API_URL environment variable.",
    );
  }

  if (!SONGBIRD_API_KEY) {
    throw new Error(
      "Songbird API key is not configured. Set SONGBIRD_API_KEY environment variable.",
    );
  }

  const url = `${SONGBIRD_API_URL}${endpoint.startsWith("/") ? endpoint.slice(1) : endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": SONGBIRD_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Songbird API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export const songbird = {

  request: songbirdRequest,

};
