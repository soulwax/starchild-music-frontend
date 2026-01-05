// File: src/server/api/routers/equalizer.ts

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const EqualizerBandSchema = z.number().min(-12).max(12);

export const equalizerRouter = createTRPCRouter({

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await ctx.db
      .select({
        equalizerEnabled: userPreferences.equalizerEnabled,
        equalizerPreset: userPreferences.equalizerPreset,
        equalizerBands: userPreferences.equalizerBands,
      })
      .from(userPreferences)
      .where(eq(userPreferences.userId, ctx.session.user.id))
      .limit(1);

    if (!preferences.length) {

      return {
        enabled: false,
        preset: "Flat",
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
    }

    const prefs = preferences[0];
    if (!prefs) {

      return {
        enabled: false,
        preset: "Flat",
        bands: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
    }
    return {
      enabled: prefs.equalizerEnabled ?? false,
      preset: prefs.equalizerPreset ?? "Flat",
      bands: prefs.equalizerBands ?? [0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        preset: z.string().optional(),
        bands: z.array(EqualizerBandSchema).length(9).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select({ id: userPreferences.id })
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.enabled !== undefined) {
        updateData.equalizerEnabled = input.enabled;
      }
      if (input.preset !== undefined) {
        updateData.equalizerPreset = input.preset;
      }
      if (input.bands !== undefined) {
        updateData.equalizerBands = input.bands;
      }

      let result;

      if (existing.length > 0) {

        result = await ctx.db
          .update(userPreferences)
          .set(updateData)
          .where(eq(userPreferences.userId, userId))
          .returning({
            enabled: userPreferences.equalizerEnabled,
            preset: userPreferences.equalizerPreset,
            bands: userPreferences.equalizerBands,
          });
      } else {

        result = await ctx.db
          .insert(userPreferences)
          .values({
            userId,
            equalizerEnabled: input.enabled ?? false,
            equalizerPreset: input.preset ?? "Flat",
            equalizerBands: input.bands ?? [0, 0, 0, 0, 0, 0, 0, 0, 0],
            volume: 0.7,
            playbackRate: 1.0,
            repeatMode: "none",
            shuffleEnabled: false,
            visualizerEnabled: true,
            compactMode: false,
            theme: "dark",
            autoQueueEnabled: false,
            autoQueueThreshold: 3,
            autoQueueCount: 5,
            smartMixEnabled: true,
            similarityPreference: "balanced",
          })
          .returning({
            enabled: userPreferences.equalizerEnabled,
            preset: userPreferences.equalizerPreset,
            bands: userPreferences.equalizerBands,
          });
      }

      return result[0];
    }),

  applyPreset: protectedProcedure
    .input(
      z.object({
        preset: z.string(),
        bands: z.array(EqualizerBandSchema).length(9),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db
        .select({ id: userPreferences.id })
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);

      let result;

      if (existing.length > 0) {
        result = await ctx.db
          .update(userPreferences)
          .set({
            equalizerPreset: input.preset,
            equalizerBands: input.bands,
            updatedAt: new Date(),
          })
          .where(eq(userPreferences.userId, userId))
          .returning({
            enabled: userPreferences.equalizerEnabled,
            preset: userPreferences.equalizerPreset,
            bands: userPreferences.equalizerBands,
          });
      } else {
        result = await ctx.db
          .insert(userPreferences)
          .values({
            userId,
            equalizerEnabled: true,
            equalizerPreset: input.preset,
            equalizerBands: input.bands,
            volume: 0.7,
            playbackRate: 1.0,
            repeatMode: "none",
            shuffleEnabled: false,
            visualizerEnabled: true,
            compactMode: false,
            theme: "dark",
            autoQueueEnabled: false,
            autoQueueThreshold: 3,
            autoQueueCount: 5,
            smartMixEnabled: true,
            similarityPreference: "balanced",
          })
          .returning({
            enabled: userPreferences.equalizerEnabled,
            preset: userPreferences.equalizerPreset,
            bands: userPreferences.equalizerBands,
          });
      }

      return result[0];
    }),
});
