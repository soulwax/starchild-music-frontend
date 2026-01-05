// File: src/utils/getBaseUrl.ts

import { env } from "@/env";

export function getBaseUrl(): string {

  if (env.NEXT_PUBLIC_NEXTAUTH_URL) {
    return env.NEXT_PUBLIC_NEXTAUTH_URL;
  }

  if (typeof window === "undefined") {
    try {

      if (env.NEXTAUTH_URL) {
        return env.NEXTAUTH_URL;
      }
    } catch {

    }
  }

  return "https://darkfloor.art";
}
