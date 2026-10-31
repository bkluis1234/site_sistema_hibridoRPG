import type { Express, RequestHandler, Request, Response } from "express";
import type { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import * as s from "../../../packages/shared/src/game.js";
import { versionedSchema } from "../../../packages/shared/src/sheet.js";
import * as g from "./game-service.js";
import * as sheet from "./sheet-service.js";
import {
  member,
  campaignGM,
  management,
  checkVersion,
  campaignLog,
} from "./management-service.js";
import { appendGameEvent } from "./game-events.js";
import { HttpError } from "./errors.js";
const uuid = (v: unknown) => z.uuid().parse(v);
const gmContext = (req: Request) => req.get("X-View-Context") === "gm";
export function mountGameRoutes(
  app: Express,
  db: PrismaClient,
  auth: RequestHandler,
) {
  app.get("/api/campaigns/:campaignId/sessions", auth, async (req, res) => {
    const campaignId = uuid(req.params.campaignId),
      m = await member(db, campaignId, res.locals.user.id);
    res.json({
      campaign: { id: m.campaign.id, name: m.campaign.name },
      isGM: m.role === "GM",
      sessions: (
        await db.gameSession.findMany({
          where: { campaignId },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      ).map(g.publicSession),
    });
  });
  app.post("/api/campaigns/:campaignId/sessions", auth, async (req, res) => {
    const campaignId = uuid(req.params.campaignId),
      input = s.gameCreateSchema.parse(req.body),
      actor = res.locals.user.id;
    res.status(201).json(
      await management(
        db,
        actor,
        "game-create:" + campaignId,
        input,
        (tx) => campaignGM(tx, campaignId, actor, true),
        (tx) => g.createGame(tx, campaignId, actor, input),
      ),
    );
  });
  const route = (
    path: string,
    schema: z.ZodType,
    handler: (
      tx: Prisma.TransactionClient,
      a: g.GameAccess,
      input: any,
      req: Request,
      res: Response,
    ) => Promise<unknown>,
    options: {
      method?: "post" | "patch" | "delete";
      permission?: (
        tx: Prisma.TransactionClient,
        a: g.GameAccess,
        input: any,
        req: Request,
      ) => Promise<unknown>;
    } = {},
  ) => {
    const method = options.method ?? "post";
    app[method]("/api/sessions/:sessionId" + path, auth, async (req, res) => {
      const id = uuid(req.params.sessionId),
        input = schema.parse(req.body) as { operationId: string },
        actor = res.locals.user.id;
      res.json(
        await management(
          db,
          actor,
          method + ":" + req.path,
          input,
          async (tx) => {
            const access = await g.gameAccess(
              tx,
              id,
              actor,
              gmContext(req),
              true,
            );
            await options.permission?.(tx, access, input, req);
            return access;
          },
          (tx, access) => handler(tx, access, input, req, res),
        ),
      );
    });
  };
  const gmPermission = async (_tx: Prisma.TransactionClient, a: g.GameAccess) =>
    g.requireGM(a);
  for (const action of ["start", "pause", "resume", "finish", "cancel"])
    route(
      "/" + action,
      s.gameLifecycleSchema,
      (tx, a, input) => g.transitionGame(tx, a, action, input),
      { permission: gmPermission },
    );
  app.get("/api/sessions/:sessionId", auth, async (req, res) =>
    res.json(
      await g.gameDetails(
        db,
        uuid(req.params.sessionId),
        res.locals.user.id,
        gmContext(req),
      ),
    ),
  );
  route("/join", s.gameJoinSchema, (tx, a, input) => g.joinGame(tx, a, input), {
    permission: async (tx, a, input) => {
      if (input.characterId) {
        const c = await g.gameCharacter(tx, a, input.characterId, false);
        if (c.ownerId !== a.actorId)
          throw new HttpError(
            403,
            "OWNER_REQUIRED",
            "Entre com sua própria ficha.",
          );
      }
    },
  });
  app.post("/api/sessions/:sessionId/heartbeat", auth, async (req, res) => {
    const input = s.heartbeatSchema.parse(req.body);
    const result = await db.$transaction(async (tx) => {
      const a = await g.gameAccess(
        tx,
        uuid(req.params.sessionId),
        res.locals.user.id,
      );
      return g.heartbeat(tx, a, res.locals.sessionId, input);
    });
    res.json(result);
  });
  app.get("/api/sessions/:sessionId/characters", auth, async (req, res) => {
    const a = await g.gameAccess(
      db,
      uuid(req.params.sessionId),
      res.locals.user.id,
      gmContext(req),
    );
    res.json({
      characters: await db.character.findMany({
        where: {
          campaignId: a.campaign.id,
          archivedAt: null,
          status: { not: "ARCHIVED" },
          ...(a.gm
            ? {
                owner: {
                  disabledAt: null,
                  memberships: {
                    some: { campaignId: a.campaign.id, status: "ACTIVE" },
                  },
                },
              }
            : { ownerId: a.actorId }),
        },
        select: {
          id: true,
          name: true,
          ownerId: true,
          version: true,
          owner: { select: { username: true } },
        },
        orderBy: { name: "asc" },
        take: 200,
      }),
    });
  });
  app.get(
    "/api/sessions/:sessionId/characters/:characterId/sheet",
    auth,
    async (req, res) => {
      const a = await g.gameAccess(
          db,
          uuid(req.params.sessionId),
          res.locals.user.id,
          gmContext(req),
        ),
        id = uuid(req.params.characterId);
      await g.gameCharacter(db, a, id, false);
      res.json({
        sheet: await sheet.getSheet(db, id, a.actorId, 5242880, a.gm),
      });
    },
  );
  app.get("/api/sessions/:sessionId/events", auth, async (req, res) => {
    const q = z
      .object({
        before: z.uuid().optional(),
        after: z.uuid().optional(),
        category: z
          .enum(["MECHANICAL", "NARRATIVE", "ADMINISTRATIVE"])
          .optional(),
      })
      .strict()
      .refine((v) => !(v.before && v.after))
      .parse(req.query);
    const a = await g.gameAccess(
      db,
      uuid(req.params.sessionId),
      res.locals.user.id,
      gmContext(req),
    );
    res.json(await g.gameEvents(db, a, q));
  });
  route(
    "/events",
    s.gameEventSchema,
    (tx, a, input) => g.manualEvent(tx, a, input),
    {
      permission: async (_tx, a, input) => {
        if (input.visibility === "GM_ONLY" && !a.gm)
          throw new HttpError(403, "GM_REQUIRED", "Abra o contexto de mestre.");
      },
    },
  );
  app.get("/api/sessions/:sessionId/rolls", auth, async (req, res) => {
    const q = z
        .object({
          filter: z
            .enum(["ALL", "MINE", "SKILL", "DAMAGE", "GM"])
            .default("ALL"),
          before: z.uuid().optional(),
        })
        .strict()
        .parse(req.query),
      a = await g.gameAccess(
        db,
        uuid(req.params.sessionId),
        res.locals.user.id,
        gmContext(req),
      );
    res.json(await g.gameRolls(db, a, q.filter, q.before));
  });
  route(
    "/rolls",
    s.gameRollSchema,
    (tx, a, input) => g.sessionRoll(tx, a, input),
    { permission: (tx, a, input) => g.rollPermission(tx, a, input) },
  );
  const rollPermission = async (
    tx: Prisma.TransactionClient,
    a: g.GameAccess,
    _input: any,
    req: Request,
  ) => {
    const r = await g.visibleRoll(tx, a, uuid(req.params.rollId));
    if (!r.characterId)
      throw new HttpError(
        400,
        "SKILL_REQUIRED",
        "Teste de perícia necessário.",
      );
    await g.gameCharacter(tx, a, r.characterId);
  };
  route(
    "/rolls/:rollId/effort",
    s.gameEffortSchema,
    (tx, a, input, req) =>
      g.rollDecision(tx, a, uuid(req.params.rollId), input),
    { permission: rollPermission },
  );
  route(
    "/rolls/:rollId/authorize-retry",
    s.gameRetrySchema,
    (tx, a, input, req) =>
      g.rollDecision(tx, a, uuid(req.params.rollId), input, true),
    {
      permission: async (tx, a, input, req) => {
        if (!a.gm)
          throw new HttpError(403, "GM_REQUIRED", "Abra o contexto de mestre.");
        await rollPermission(tx, a, input, req);
      },
    },
  );
  const charPermission = async (
    tx: Prisma.TransactionClient,
    a: g.GameAccess,
    input: any,
  ) => {
    await g.gameCharacter(tx, a, input.characterId);
  };
  const charWrite = (
    path: string,
    schema: z.ZodType,
    handler: (
      tx: Prisma.TransactionClient,
      id: string,
      actor: string,
      input: any,
      req: Request,
    ) => Promise<unknown>,
    method: "post" | "patch" | "delete" = "patch",
  ) =>
    route(
      path,
      schema,
      async (tx, a, input, req) => {
        g.requireActive(a);
        await g.gameCharacter(tx, a, input.characterId);
        await tx.$queryRaw`SELECT id FROM characters WHERE id=${input.characterId} FOR UPDATE`;
        await sheet.authorized(tx, input.characterId, a.actorId, true);
        const { characterId, ...body } = input;
        return handler(tx, characterId, a.actorId, body, req);
      },
      { method, permission: charPermission },
    );
  charWrite("/resources", s.gameResourceSchema, (tx, id, actor, input) =>
    sheet.changeResource(tx, id, actor, input),
  );
  charWrite("/conditions", s.gameConditionSchema, (tx, id, actor, input) =>
    sheet.saveConditions(tx, id, actor, input),
  );
  charWrite("/critical", s.gameCriticalSchema, (tx, id, actor, input) =>
    sheet.changeCritical(tx, id, actor, input),
  );
  charWrite(
    "/injuries",
    s.gameInjuryCreateSchema,
    (tx, id, actor, input) => sheet.saveInjury(tx, id, actor, input),
    "post",
  );
  charWrite(
    "/injuries/:injuryId",
    s.gameInjuryUpdateSchema,
    (tx, id, actor, input, req) =>
      sheet.saveInjury(tx, id, actor, input, uuid(req.params.injuryId)),
  );
  charWrite(
    "/inventory",
    s.gameItemCreateSchema,
    (tx, id, actor, input) => sheet.saveItem(tx, id, actor, input),
    "post",
  );
  charWrite(
    "/inventory/:itemId",
    s.gameItemUpdateSchema,
    (tx, id, actor, input, req) =>
      sheet.saveItem(tx, id, actor, input, uuid(req.params.itemId)),
  );
  charWrite(
    "/inventory/:itemId",
    s.gameItemRemoveSchema,
    (tx, id, actor, input, req) =>
      sheet.removeItem(tx, id, actor, uuid(req.params.itemId), input.version),
    "delete",
  );
  route(
    "/inventory/:itemId/use",
    s.gameItemUseSchema,
    (tx, a, input, req) => g.useItem(tx, a, uuid(req.params.itemId), input),
    { permission: charPermission },
  );
  app.get("/api/sessions/:sessionId/notes", auth, async (req, res) => {
    const a = await g.gameAccess(
      db,
      uuid(req.params.sessionId),
      res.locals.user.id,
      gmContext(req),
    );
    res.json({
      notes: await db.sessionNote.findMany({
        where: { gameSessionId: a.session.id, AND: [g.noteVisibility(a)] },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 200,
        select: g.noteSelect,
      }),
    });
  });
  route(
    "/notes",
    s.gameNoteCreateSchema,
    (tx, a, input) => g.saveSessionNote(tx, a, input),
    { permission: (tx, a, input) => g.notePermission(tx, a, input) },
  );
  route(
    "/notes/:noteId",
    s.gameNoteUpdateSchema,
    (tx, a, input, req) =>
      g.saveSessionNote(tx, a, input, uuid(req.params.noteId)),
    {
      method: "patch",
      permission: (tx, a, input, req) =>
        g.notePermission(tx, a, input, uuid(req.params.noteId)),
    },
  );
  route(
    "/notes/:noteId",
    versionedSchema.strict(),
    (tx, a, input, req) =>
      g.removeSessionNote(tx, a, uuid(req.params.noteId), input),
    {
      method: "delete",
      permission: (tx, a, input, req) =>
        g.notePermission(tx, a, {}, uuid(req.params.noteId)),
    },
  );
  route(
    "/summary",
    s.gameNarrativeSchema,
    async (tx, a, input) => {
      g.requireGM(a);
      checkVersion(a.session.version, input.version);
      await tx.gameSession.update({
        where: { id: a.session.id },
        data: {
          narrativeSummary: input.narrativeSummary,
          version: { increment: 1 },
        },
      });
      await appendGameEvent(
        tx,
        a.session.id,
        a.actorId,
        "SUMMARY_PUBLISHED",
        { narrativeSummary: input.narrativeSummary },
        { category: "NARRATIVE" },
      );
      return { published: true };
    },
    { method: "patch", permission: gmPermission },
  );
  app.get("/api/sessions/:sessionId/summary", auth, async (req, res) => {
    const a = await g.gameAccess(
      db,
      uuid(req.params.sessionId),
      res.locals.user.id,
      gmContext(req),
    );
    res.json({ summary: await g.gameSummary(db, a) });
  });
  route(
    "/transfer-settings",
    s.transferSettingsSchema,
    async (tx, a, input) => {
      g.requireOpen(a);
      g.requireGM(a);
      checkVersion(a.campaign.version, input.version);
      await tx.campaign.update({
        where: { id: a.campaign.id },
        data: {
          itemTransfersEnabled: input.enabled,
          transferApprovalMode: input.approvalMode,
          version: { increment: 1 },
        },
      });
      await campaignLog(
        tx,
        a.campaign.id,
        a.actorId,
        "TRANSFER_POLICY_CHANGED",
        a.campaign.id,
        undefined,
        { enabled: input.enabled, approvalMode: input.approvalMode },
        input.reason,
      );
      await appendGameEvent(
        tx,
        a.session.id,
        a.actorId,
        "TRANSFER_POLICY_CHANGED",
        { enabled: input.enabled, approvalMode: input.approvalMode },
        { category: "ADMINISTRATIVE" },
      );
      return { configured: true };
    },
    { method: "patch", permission: gmPermission },
  );
  route(
    "/transfers",
    s.transferCreateSchema,
    (tx, a, input) => g.createTransfer(tx, a, input),
    {
      permission: async (tx, a) => {
        await g.participant(tx, a);
      },
    },
  );
  route(
    "/transfers/:transferId/review",
    s.transferReviewSchema,
    (tx, a, input, req) =>
      g.reviewTransfer(tx, a, uuid(req.params.transferId), input),
    {
      permission: (tx, a, input, req) =>
        g.transferPermission(tx, a, uuid(req.params.transferId)),
    },
  );
  app.get("/api/sessions/:sessionId/transfers", auth, async (req, res) => {
    const a = await g.gameAccess(
      db,
      uuid(req.params.sessionId),
      res.locals.user.id,
      gmContext(req),
    );
    res.json({
      enabled: a.campaign.itemTransfersEnabled,
      transfers: await db.itemTransfer.findMany({
        where: {
          gameSessionId: a.session.id,
          ...(a.gm
            ? {}
            : {
                OR: [
                  { requesterId: a.actorId },
                  { destinationCharacter: { ownerId: a.actorId } },
                ],
              }),
        },
        select: {
          id: true,
          sourceCharacterId: true,
          destinationCharacterId: true,
          requesterId: true,
          quantity: true,
          status: true,
          itemSnapshot: true,
          version: true,
          reason: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  mountStream(app, db, auth);
}
function mountStream(app: Express, db: PrismaClient, auth: RequestHandler) {
  const connections = new Map<string, number>();
  const activeStreams = new Set<() => void>();
  app.locals.closeGameStreams = () => {
    for (const close of [...activeStreams]) close();
  };
  app.get("/api/sessions/:sessionId/stream", auth, async (req, res) => {
    const id = uuid(req.params.sessionId),
      actor = res.locals.user.id,
      sessionId = res.locals.sessionId as string;
    const query = z
        .object({
          context: z.enum(["gm", "player"]).default("player"),
          after: z.uuid().optional(),
        })
        .strict()
        .parse(req.query),
      gm = query.context === "gm";
    let access = await g.gameAccess(db, id, actor, gm);
    let cursor =
      query.after ??
      (req.get("Last-Event-ID") ? uuid(req.get("Last-Event-ID")) : undefined);
    if (cursor) await g.gameEvents(db, access, { after: cursor });
    const key = actor;
    if ((connections.get(key) ?? 0) >= 4)
      throw new HttpError(
        429,
        "STREAM_LIMIT",
        "Limite de conexões simultâneas atingido. Feche uma aba ou use a atualização periódica.",
      );
    connections.set(key, (connections.get(key) ?? 0) + 1);
    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 3000\n: conectado\n\n");
    let closed = false,
      busy = false;
    const close = () => {
      if (closed) return;
      closed = true;
      clearInterval(timer);
      activeStreams.delete(close);
      connections.set(key, Math.max(0, (connections.get(key) ?? 1) - 1));
      if (!connections.get(key)) connections.delete(key);
      if (!res.writableEnded) res.end();
    };
    const tick = async () => {
      if (closed || busy) return;
      busy = true;
      try {
        const authSession = await db.session.findUnique({
          where: { id: sessionId },
          select: {
            expiresAt: true,
            idleExpiresAt: true,
            user: { select: { disabledAt: true } },
          },
        });
        if (
          !authSession ||
          authSession.user.disabledAt ||
          authSession.expiresAt <= new Date() ||
          authSession.idleExpiresAt <= new Date()
        ) {
          close();
          return;
        }
        access = await g.gameAccess(db, id, actor, gm);
        const result = await g.gameEvents(
          db,
          access,
          cursor ? { after: cursor } : {},
        );
        const entries = cursor ? result.entries : [...result.entries].reverse();
        for (const entry of entries) {
          if (closed) break;
          const accepted = res.write(
            "id: " +
              entry.id +
              "\nevent: change\ndata: " +
              JSON.stringify({ eventId: entry.id, type: entry.type }) +
              "\n\n",
          );
          cursor = entry.id;
          if (!accepted) {
            close();
            return;
          }
        }
        if (!closed) res.write(": heartbeat\n\n");
      } catch {
        close();
      } finally {
        busy = false;
      }
    };
    const timer = setInterval(() => void tick(), 2000);
    activeStreams.add(close);
    res.on("close", close);
    req.on("aborted", close);
    void tick();
  });
}
