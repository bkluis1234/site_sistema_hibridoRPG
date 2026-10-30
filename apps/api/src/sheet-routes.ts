import type { Express, RequestHandler } from "express";
import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import * as schemas from "../../../packages/shared/src/sheet.js";
import * as service from "./sheet-service.js";
export function mountSheetRoutes(
  app: Express,
  db: PrismaClient,
  auth: RequestHandler,
  portraitMaxBytes = 5242880,
) {
  const id = (v: unknown) => z.uuid().parse(v);
  app.get("/api/characters/:id/sheet", auth, async (req, res) =>
    res.json({
      sheet: await service.getSheet(
        db,
        id(req.params.id),
        res.locals.user.id,
        portraitMaxBytes,
      ),
    }),
  );
  const route = (
    path: string,
    schema: z.ZodType,
    action: string,
    handler: (
      tx: Parameters<typeof service.authorized>[0],
      characterId: string,
      actorId: string,
      input: any,
      req: Parameters<RequestHandler>[0],
      access: Awaited<ReturnType<typeof service.authorized>>,
    ) => Promise<unknown>,
    method: "post" | "patch" | "delete" = "patch",
  ) => {
    app[method](path, auth, async (req, res) => {
      const characterId = id(req.params.id);
      const input = schema.parse(req.body) as { operationId: string };
      const actorId = res.locals.user.id;
      res.json(
        await service.mutate(
          db,
          characterId,
          actorId,
          action + ":" + req.path,
          input,
          (tx, access) => handler(tx, characterId, actorId, input, req, access),
        ),
      );
    });
  };
  route(
    "/api/characters/:id/identity",
    schemas.identitySchema,
    "identity",
    (tx, id, actor, input) => service.saveIdentity(tx, id, actor, input),
  );
  route(
    "/api/characters/:id/attributes",
    schemas.attributesSchema,
    "attributes",
    (tx, id, actor, input) => service.saveAttributes(tx, id, actor, input),
  );
  route(
    "/api/characters/:id/skills",
    schemas.skillsSchema,
    "skills",
    (tx, id, actor, input) => service.saveSkills(tx, id, actor, input),
  );
  route(
    "/api/characters/:id/resources",
    schemas.resourceSchema,
    "resources",
    (tx, id, actor, input) => service.changeResource(tx, id, actor, input),
  );
  route(
    "/api/characters/:id/inventory",
    schemas.inventoryCreateSchema,
    "item-create",
    (tx, id, actor, input) => service.saveItem(tx, id, actor, input),
    "post",
  );
  route(
    "/api/characters/:id/inventory/:itemId",
    schemas.inventoryUpdateSchema,
    "item-update",
    (tx, id, actor, input, req) =>
      service.saveItem(tx, id, actor, input, idParam(req.params.itemId)),
  );
  route(
    "/api/characters/:id/inventory/:itemId",
    schemas.versionedSchema.strict(),
    "item-delete",
    (tx, id, actor, input, req) =>
      service.removeItem(
        tx,
        id,
        actor,
        idParam(req.params.itemId),
        input.version,
      ),
    "delete",
  );
  route(
    "/api/characters/:id/conditions",
    schemas.conditionSchema,
    "conditions",
    (tx, id, actor, input) => service.saveConditions(tx, id, actor, input),
  );
  route(
    "/api/characters/:id/critical",
    schemas.criticalSchema,
    "critical",
    (tx, id, actor, input) => service.changeCritical(tx, id, actor, input),
  );
  route(
    "/api/characters/:id/injuries",
    schemas.injuryCreateSchema,
    "injury-create",
    (tx, id, actor, input) => service.saveInjury(tx, id, actor, input),
    "post",
  );
  route(
    "/api/characters/:id/injuries/:injuryId",
    schemas.injuryUpdateSchema,
    "injury-update",
    (tx, id, actor, input, req) =>
      service.saveInjury(tx, id, actor, input, idParam(req.params.injuryId)),
  );
  route(
    "/api/characters/:id/submit",
    schemas.versionedSchema.strict(),
    "submit",
    (tx, id, actor, input) => service.submitSheet(tx, id, actor, input.version),
    "post",
  );
  route(
    "/api/characters/:id/reopen",
    schemas.versionedSchema.strict(),
    "reopen",
    (tx, id, actor, input) =>
      service.submitSheet(tx, id, actor, input.version, true),
    "post",
  );
  route(
    "/api/characters/:id/rolls/:rollId/effort",
    schemas.effortSchema,
    "effort",
    (tx, id, actor, input, req) =>
      service.effort(tx, id, actor, idParam(req.params.rollId), input),
    "post",
  );
  route(
    "/api/characters/:id/rolls/:rollId/authorize-retry",
    schemas.authorizeRetrySchema,
    "authorize-retry",
    (tx, id, actor, input, req, access) =>
      service.authorizeRetry(
        tx,
        id,
        actor,
        idParam(req.params.rollId),
        input,
        access.isGM,
      ),
    "post",
  );
  route(
    "/api/characters/:id/fatigue-policy",
    schemas.fatiguePolicySchema,
    "fatigue-policy",
    (tx, id, actor, input, req, access) =>
      service.saveFatiguePolicy(tx, id, actor, input, access.isGM),
  );
  app.post("/api/dice/roll", auth, async (req, res) => {
    const input = schemas.diceSchema.parse(req.body);
    res.json(
      await service.mutate(
        db,
        input.characterId,
        res.locals.user.id,
        "dice",
        input,
        (tx) =>
          service.createRoll(tx, input.characterId, res.locals.user.id, input),
      ),
    );
  });
  app.get("/api/characters/:id/rolls", auth, async (req, res) => {
    const characterId = id(req.params.id);
    await service.authorized(db, characterId, res.locals.user.id);
    const rolls = await db.diceRoll.findMany({
      where: { characterId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        characterId: true,
        expression: true,
        results: true,
        initialResults: true,
        total: true,
        skillKey: true,
        baseTarget: true,
        fatiguePenalty: true,
        target: true,
        outcome: true,
        effortMode: true,
        version: true,
        finalizedAt: true,
        retryRequestedAt: true,
        retryAuthorizedById: true,
        createdAt: true,
      },
    });
    res.json({ rolls });
  });
  app.get("/api/characters/:id/history", auth, async (req, res) => {
    const characterId = id(req.params.id);
    await service.authorized(db, characterId, res.locals.user.id);
    const before = req.query.before
      ? z.number().int().positive().parse(Number(req.query.before))
      : undefined;
    const entries = await db.characterAuditLog.findMany({
      where: {
        characterId,
        ...(before ? { recordVersion: { lt: before } } : {}),
      },
      orderBy: [{ recordVersion: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        action: true,
        recordVersion: true,
        beforeData: true,
        afterData: true,
        createdAt: true,
        actor: { select: { username: true } },
      },
    });
    res.json({
      entries,
      nextBefore: entries.length === 50 ? entries.at(-1)?.recordVersion : null,
    });
  });
}
function idParam(value: unknown) {
  return z.uuid().parse(value);
}
