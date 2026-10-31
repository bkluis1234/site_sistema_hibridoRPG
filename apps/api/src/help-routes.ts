import type { Express, RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { GUIDE_KEYS, guides } from "../../../packages/shared/src/help.js";

export function mountHelpRoutes(
  app: Express,
  db: PrismaClient,
  auth: RequestHandler,
) {
  app.get("/api/help", auth, async (_req, res) => {
    const progress = await db.tutorialProgress.findMany({
      where: { userId: res.locals.user.id },
      select: { guideKey: true, completed: true, updatedAt: true },
    });
    res.json({ guides, progress });
  });
  app.patch("/api/help/progress/:key", auth, async (req, res) => {
    const guideKey = z.enum(GUIDE_KEYS).parse(req.params.key);
    const input = z.object({ completed: z.boolean() }).strict().parse(req.body);
    const entry = await db.tutorialProgress.upsert({
      where: { userId_guideKey: { userId: res.locals.user.id, guideKey } },
      create: {
        userId: res.locals.user.id,
        guideKey,
        completed: input.completed,
      },
      update: { completed: input.completed },
      select: { guideKey: true, completed: true, updatedAt: true },
    });
    res.json({ progress: entry });
  });
}
