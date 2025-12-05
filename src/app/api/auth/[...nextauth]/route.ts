// File: src/app/api/auth/[...nextauth]/route.ts

import { handlers } from "@/server/auth";

// Mark as dynamic to prevent Next.js from trying to analyze during build
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
