// File: src/server/api/root.ts

import { equalizerRouter } from "@/server/api/routers/equalizer";
import { musicRouter } from "@/server/api/routers/music";
import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  post: postRouter,
  music: musicRouter,
  equalizer: equalizerRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
