import type { Express, RequestHandler, Request, Response } from "express";
import { Prisma, type PrismaClient } from "@prisma/client";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import * as s from "../../../packages/shared/src/campaigns.js";
import { versionedSchema } from "../../../packages/shared/src/sheet.js";
import * as m from "./management-service.js";
import { authorized, mutate, audit, json } from "./sheet-service.js";
import { HttpError } from "./errors.js";
import { randomToken, tokenHash } from "./security.js";
import { randomUUID } from "node:crypto";
const uuid = (x: unknown) => z.uuid().parse(x);
export function mountManagementRoutes(
  app: Express,
  db: PrismaClient,
  auth: RequestHandler,
  admin: RequestHandler,
) {
  const managementRoute = (
    method: "post" | "patch" | "delete",
    path: string,
    schema: z.ZodType,
    permission: (tx: m.Tx, actor: string, req: Request) => Promise<any>,
    handler: (
      tx: m.Tx,
      actor: string,
      input: any,
      req: Request,
      res: Response,
      context: any,
    ) => Promise<unknown>,
  ) => {
    app[method](path, auth, async (req, res) => {
      const input = schema.parse(req.body) as { operationId: string };
      res
        .status(
          method === "post" &&
            [
              "/api/campaigns",
              "/api/campaigns/:id/invites",
              "/api/admin/gm-invites",
            ].includes(path)
            ? 201
            : 200,
        )
        .json(
          await m.management(
            db,
            res.locals.user.id,
            method + ":" + req.path,
            input,
            (tx) => permission(tx, res.locals.user.id, req),
            (tx, ctx) => handler(tx, res.locals.user.id, input, req, res, ctx),
          ),
        );
    });
  };
  const gm = (tx: m.Tx, actor: string, req: Request) =>
    m.campaignGM(tx, uuid(req.params.id), actor, true);
  const globalAdmin = (tx: m.Tx, actor: string) => m.administration(tx, actor);
  app.get("/api/settings/public", async (_req, res) => {
    const settings = await db.platformSettings.findUniqueOrThrow({
      where: { id: "global" },
      select: { registrationOpen: true },
    });
    res.json({
      ...settings,
      systemVersion: "2.6",
      imageStorageConfigured: false,
    });
  });
  app.get("/api/campaigns", auth, async (_req, res) =>
    res.json({ campaigns: await m.listCampaigns(db, res.locals.user.id) }),
  );
  managementRoute(
    "post",
    "/api/campaigns",
    s.campaignCreateSchema,
    async (tx, actor) => m.activeUser(tx, actor),
    (tx, actor, input) => m.createCampaign(tx, actor, input),
  );
  app.get("/api/campaigns/:id", auth, async (req, res) =>
    res.json(
      await m.campaignDetails(db, uuid(req.params.id), res.locals.user.id),
    ),
  );
  app.get("/api/campaigns/:id/manage", auth, async (req, res) =>
    res.json(
      await m.campaignDetails(
        db,
        uuid(req.params.id),
        res.locals.user.id,
        true,
      ),
    ),
  );
  managementRoute(
    "patch",
    "/api/campaigns/:id",
    s.campaignUpdateSchema,
    gm,
    (tx, actor, input, req) =>
      m.updateCampaign(tx, uuid(req.params.id), actor, input),
  );
  managementRoute(
    "patch",
    "/api/campaigns/:id/gm-notes",
    s.gmNotesSchema,
    gm,
    async (tx, actor, input, req, campaign, _context) => {
      const c = await tx.campaign.findUniqueOrThrow({
        where: { id: uuid(req.params.id) },
      });
      m.checkVersion(c.version, input.version);
      const result = await tx.campaign.update({
        where: { id: c.id },
        data: { gmNotes: input.gmNotes, version: { increment: 1 } },
      });
      await m.campaignLog(
        tx,
        c.id,
        actor,
        "GM_NOTES_UPDATED",
        c.id,
        { gmNotes: c.gmNotes },
        { gmNotes: input.gmNotes },
      );
      return { version: result.version };
    },
  );
  app.get("/api/campaigns/:id/invites", auth, async (req, res) => {
    const id = uuid(req.params.id);
    await m.campaignGM(db, id, res.locals.user.id);
    res.json({
      invites: await db.campaignInvite.findMany({
        where: { campaignId: id },
        select: {
          id: true,
          expiresAt: true,
          maxUses: true,
          useCount: true,
          revokedAt: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  managementRoute(
    "post",
    "/api/campaigns/:id/invites",
    s.campaignInviteSchema,
    gm,
    (tx, actor, input, req) =>
      m.createInvite(tx, uuid(req.params.id), actor, input),
  );
  managementRoute(
    "delete",
    "/api/campaigns/:id/invites/:inviteId",
    versionedSchema.strict(),
    gm,
    async (tx, actor, input, req) => {
      const campaignId = uuid(req.params.id),
        id = uuid(req.params.inviteId);
      const i = await tx.campaignInvite.findFirst({
        where: { id, campaignId },
      });
      if (!i) throw new HttpError(404, "NOT_FOUND", "Convite não encontrado.");
      m.checkVersion(i.version, input.version);
      if (i.revokedAt)
        throw new HttpError(409, "INVITE_UNAVAILABLE", "Convite já revogado.");
      await tx.campaignInvite.update({
        where: { id },
        data: { revokedAt: new Date(), version: { increment: 1 } },
      });
      await m.campaignLog(tx, campaignId, actor, "PLAYER_INVITE_REVOKED", id);
      return { revoked: true };
    },
  );
  app.use(
    "/api/campaign-memberships/join",
    rateLimit({
      windowMs: 900000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas tentativas de convite. Aguarde.",
        },
      },
    }),
  );
  managementRoute(
    "post",
    "/api/campaign-memberships/join",
    s.joinSchema,
    async (tx, actor) => m.activeUser(tx, actor),
    (tx, actor, input) => m.joinCampaign(tx, actor, input.code),
  );
  managementRoute(
    "patch",
    "/api/campaigns/:id/members/:userId",
    s.membershipSchema,
    gm,
    (tx, actor, input, req) =>
      m.reviewMember(
        tx,
        uuid(req.params.id),
        actor,
        uuid(req.params.userId),
        input,
      ),
  );
  managementRoute(
    "post",
    "/api/campaigns/:id/characters",
    s.linkSchema,
    async (tx, actor, req) => {
      const id = uuid(req.params.id);
      await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${id} FOR UPDATE`;
      return m.member(tx, id, actor, false);
    },
    (tx, actor, input, req) =>
      m.linkCharacter(tx, uuid(req.params.id), actor, input),
  );
  managementRoute(
    "delete",
    "/api/campaigns/:id/characters",
    s.linkSchema,
    async (tx, actor, req) => {
      const id = uuid(req.params.id);
      await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${id} FOR UPDATE`;
      return m.member(tx, id, actor, false);
    },
    (tx, actor, input, req) =>
      m.linkCharacter(tx, uuid(req.params.id), actor, input, true),
  );
  app.get("/api/campaigns/:id/eligible-characters", auth, async (req, res) => {
    const id = uuid(req.params.id);
    await m.campaignGM(db, id, res.locals.user.id);
    res.json({
      characters: await db.character.findMany({
        where: {
          archivedAt: null,
          status: { not: "ARCHIVED" },
          OR: [{ campaignId: null }, { campaignId: id }],
          owner: {
            disabledAt: null,
            memberships: { some: { campaignId: id, status: "ACTIVE" } },
          },
        },
        select: {
          id: true,
          name: true,
          ownerId: true,
          version: true,
          owner: { select: { username: true } },
        },
        take: 200,
      }),
    });
  });
  app.get(
    "/api/campaigns/:campaignId/characters/:characterId/shared",
    auth,
    async (req, res) =>
      res.json({
        character: await m.sharedCharacter(
          db,
          uuid(req.params.campaignId),
          uuid(req.params.characterId),
          res.locals.user.id,
        ),
      }),
  );
  app.get("/api/campaigns/:id/history", auth, async (req, res) => {
    const id = uuid(req.params.id);
    await m.campaignGM(db, id, res.locals.user.id);
    const cursor = req.query.before
      ? z.uuid().parse(req.query.before)
      : undefined;
    res.json({
      entries: await db.campaignAuditLog.findMany({
        where: { campaignId: id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        select: {
          id: true,
          action: true,
          targetId: true,
          beforeData: true,
          afterData: true,
          reason: true,
          createdAt: true,
          actor: { select: { username: true } },
        },
      }),
    });
  });
  app.get("/api/campaigns/:id/scoped-notes", auth, async (req, res) => {
    const id = uuid(req.params.id);
    await m.campaignGM(db, id, res.locals.user.id);
    res.json({
      notes: await db.characterNote.findMany({
        where: { campaignId: id, visibility: "GM_ONLY" },
        select: {
          id: true,
          title: true,
          body: true,
          characterId: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    });
  });
  app.get("/api/campaigns/:id/requests", auth, async (req, res) => {
    const id = uuid(req.params.id);
    await m.campaignGM(db, id, res.locals.user.id);
    res.json({
      requests: await db.characterChangeRequest.findMany({
        where: { character: { campaignId: id }, status: "PENDING" },
        select: {
          id: true,
          characterId: true,
          kind: true,
          reason: true,
          patch: true,
          baseVersion: true,
          version: true,
          createdAt: true,
          requester: { select: { username: true } },
          character: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 100,
      }),
    });
  });
  const charRoute = (
    path: string,
    schema: z.ZodType,
    action: string,
    handler: (
      tx: m.Tx,
      id: string,
      actor: string,
      input: any,
      req: Request,
      access: Awaited<ReturnType<typeof authorized>>,
    ) => Promise<unknown>,
    method: "post" | "patch" | "delete" = "post",
  ) =>
    app[method](path, auth, async (req, res) => {
      const id = uuid(req.params.id),
        actor = res.locals.user.id,
        input = schema.parse(req.body) as { operationId: string };
      res.json(
        await mutate(
          db,
          id,
          actor,
          action + ":" + req.path,
          input,
          (tx, access) => handler(tx, id, actor, input, req, access),
        ),
      );
    });
  charRoute(
    "/api/characters/:id/approval",
    s.approvalSchema,
    "approval",
    (tx, id, actor, input) => m.approveCharacter(tx, id, actor, input),
  );
  charRoute(
    "/api/characters/:id/change-requests",
    s.changeRequestSchema,
    "change-request",
    (tx, id, actor, input) => m.requestChange(tx, id, actor, input),
  );
  charRoute(
    "/api/characters/:id/change-requests/:requestId/review",
    s.changeReviewSchema,
    "change-review",
    (tx, id, actor, input, req) =>
      m.reviewChange(tx, id, actor, uuid(req.params.requestId), input),
  );
  app.get("/api/characters/:id/change-requests", auth, async (req, res) => {
    const id = uuid(req.params.id);
    await authorized(db, id, res.locals.user.id);
    res.json({
      requests: await db.characterChangeRequest.findMany({
        where: { characterId: id },
        select: {
          id: true,
          kind: true,
          reason: true,
          patch: true,
          baseVersion: true,
          status: true,
          reviewComment: true,
          version: true,
          createdAt: true,
          reviewedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    });
  });
  charRoute(
    "/api/characters/:id/sharing",
    s.sharingSchema,
    "sharing",
    async (tx, id, actor, input, _req, access) => {
      if (!access.isOwner)
        throw new HttpError(
          403,
          "OWNER_REQUIRED",
          "Somente o proprietário escolhe os dados compartilhados.",
        );
      m.checkVersion(access.character.sharingVersion, input.version);
      await tx.character.update({
        where: { id },
        data: {
          sharingEnabled: input.sharingEnabled,
          publicFields: input.publicFields,
          sharingVersion: { increment: 1 },
        },
      });
      await audit(
        tx,
        id,
        actor,
        "SHARING_UPDATED",
        {
          enabled: access.character.sharingEnabled,
          fields: access.character.publicFields,
        },
        { enabled: input.sharingEnabled, fields: input.publicFields },
        { visibility: "PRIVATE" },
      );
      return { saved: true };
    },
    "patch",
  );
  app.get("/api/characters/:id/notes", auth, async (req, res) => {
    const id = uuid(req.params.id),
      access = await authorized(db, id, res.locals.user.id);
    const visibilities = [
      "PUBLIC",
      ...(access.isOwner ? ["PRIVATE"] : []),
      ...(access.isGM && req.get("X-View-Context") === "gm" ? ["GM_ONLY"] : []),
    ] as ("PUBLIC" | "PRIVATE" | "GM_ONLY")[];
    res.json({
      notes: await db.characterNote.findMany({
        where: {
          characterId: id,
          OR: [
            { visibility: { in: visibilities.filter((v) => v !== "GM_ONLY") } },
            ...(visibilities.includes("GM_ONLY") && access.character.campaignId
              ? [
                  {
                    visibility: "GM_ONLY" as const,
                    campaignId: access.character.campaignId,
                  },
                ]
              : []),
          ],
        },
        select: {
          id: true,
          title: true,
          body: true,
          visibility: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    });
  });
  const noteHandler = async (
    tx: m.Tx,
    id: string,
    actor: string,
    input: any,
    req: Request,
    access: Awaited<ReturnType<typeof authorized>>,
    remove = false,
  ) => {
    const noteId = req.params.noteId ? uuid(req.params.noteId) : null;
    const before = noteId
      ? await tx.characterNote.findFirst({
          where: { id: noteId, characterId: id },
        })
      : null;
    if (noteId && !before)
      throw new HttpError(404, "NOT_FOUND", "Nota não encontrada.");
    if (
      before?.visibility === "GM_ONLY" &&
      before.campaignId !== access.character.campaignId
    )
      throw new HttpError(404, "NOT_FOUND", "Nota não encontrada.");
    const allowed = (visibility: string) =>
      visibility === "PRIVATE"
        ? access.isOwner
        : visibility === "GM_ONLY"
          ? access.isGM && req.get("X-View-Context") === "gm"
          : access.isOwner || access.isGM;
    if (
      !allowed(before?.visibility ?? input.visibility) ||
      (!remove && !allowed(input.visibility))
    )
      throw new HttpError(
        404,
        "NOT_FOUND",
        "Nota não encontrada ou não autorizada.",
      );
    if (before) m.checkVersion(before.version, input.version);
    if (before && before.visibility !== input.visibility && !remove)
      throw new HttpError(
        409,
        "NOTE_VISIBILITY_LOCKED",
        "A visibilidade da nota é fixa; crie outra nota para publicar conteúdo deliberadamente.",
      );
    if (remove) {
      await tx.characterNote.delete({ where: { id: noteId! } });
      await audit(
        tx,
        id,
        actor,
        "NOTE_DELETED",
        before,
        { deleted: true },
        { visibility: before!.visibility },
      );
      return { deleted: true };
    }
    const data = {
      title: input.title,
      body: input.body,
      visibility: input.visibility,
      campaignId:
        input.visibility === "GM_ONLY" ? access.character.campaignId : null,
    };
    const note = before
      ? await tx.characterNote.update({
          where: { id: before.id },
          data: { ...data, version: { increment: 1 } },
        })
      : await tx.characterNote.create({
          data: { ...data, characterId: id, authorId: actor },
        });
    await audit(
      tx,
      id,
      actor,
      before ? "NOTE_UPDATED" : "NOTE_CREATED",
      before ?? undefined,
      note,
      { visibility: note.visibility },
    );
    return { id: note.id, version: note.version };
  };
  charRoute(
    "/api/characters/:id/notes",
    s.noteCreateSchema,
    "note-create",
    noteHandler,
  );
  charRoute(
    "/api/characters/:id/notes/:noteId",
    s.noteUpdateSchema,
    "note-update",
    noteHandler,
    "patch",
  );
  charRoute(
    "/api/characters/:id/notes/:noteId",
    versionedSchema.strict(),
    "note-delete",
    (tx, id, actor, input, req, access) =>
      noteHandler(tx, id, actor, input, req, access, true),
    "delete",
  );
  app.get("/api/notifications", auth, async (_req, res) =>
    res.json({
      notifications: await db.notification.findMany({
        where: { userId: res.locals.user.id },
        select: {
          id: true,
          message: true,
          linkPath: true,
          readAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      unread: await db.notification.count({
        where: { userId: res.locals.user.id, readAt: null },
      }),
    }),
  );
  app.patch("/api/notifications/:id", auth, async (req, res) => {
    z.object({}).strict().parse(req.body);
    const id = uuid(req.params.id);
    const found = await db.notification.findFirst({
      where: { id, userId: res.locals.user.id },
      select: { id: true },
    });
    if (!found)
      throw new HttpError(404, "NOT_FOUND", "Notificação não encontrada.");
    await db.notification.updateMany({
      where: { id, userId: res.locals.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.status(204).end();
  });
  // Administração devolve metadados operacionais; não inclui fichas, narrativas ou notas GM.
  app.get("/api/admin/users", auth, admin, async (req, res) => {
    const q = z
      .string()
      .max(64)
      .parse(String(req.query.q ?? ""))
      .trim()
      .toLowerCase();
    res.json({
      users: await db.user.findMany({
        where: q ? { username: { contains: q } } : {},
        select: {
          id: true,
          username: true,
          role: true,
          canCreateCampaigns: true,
          disabledAt: true,
          version: true,
          createdAt: true,
        },
        orderBy: { username: "asc" },
        take: 100,
      }),
    });
  });
  app.post(
    "/api/admin/reauth",
    auth,
    admin,
    rateLimit({
      windowMs: 900000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas confirmações. Aguarde.",
        },
      },
    }),
    async (req, res) => {
      const input = s.reauthSchema.parse(req.body);
      res.json(
        await m.issueAdminAuthorization(
          db,
          res.locals.user.id,
          res.locals.sessionId,
          input.password,
          input.recoveryCode,
        ),
      );
    },
  );
  for (const kind of ["account", "privileges", "role"] as const)
    managementRoute(
      "patch",
      "/api/admin/users/:userId/" + kind,
      kind === "account"
        ? s.accountSchema
        : kind === "privileges"
          ? s.privilegeSchema
          : s.globalRoleSchema,
      globalAdmin,
      async (tx, actor, input, req, res) => {
        const target = await tx.user.findUnique({
          where: { id: uuid(req.params.userId) },
        });
        await m.consumeProof(
          tx,
          actor,
          res.locals.sessionId,
          req.get("X-Admin-Authorization"),
          kind === "role" || target?.role === "ADMIN",
        );
        return m.changeAccount(tx, actor, uuid(req.params.userId), input, kind);
      },
    );
  app.get("/api/admin/campaigns", auth, admin, async (_req, res) =>
    res.json({
      campaigns: await db.campaign.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          systemVersion: true,
          version: true,
          createdAt: true,
          owner: { select: { username: true } },
          _count: { select: { members: true, characters: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    }),
  );
  app.get("/api/admin/campaigns/:id/members", auth, admin, async (req, res) =>
    res.json({
      members: await db.campaignMember.findMany({
        where: { campaignId: uuid(req.params.id) },
        select: {
          userId: true,
          role: true,
          status: true,
          version: true,
          user: {
            select: { username: true, canCreateCampaigns: true, role: true },
          },
        },
      }),
    }),
  );
  managementRoute(
    "patch",
    "/api/admin/campaigns/:id",
    s.adminCampaignSchema,
    globalAdmin,
    async (tx, actor, input, req, res) => {
      await m.consumeProof(
        tx,
        actor,
        res.locals.sessionId,
        req.get("X-Admin-Authorization"),
      );
      const id = uuid(req.params.id);
      await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${id} FOR UPDATE`;
      const c = await tx.campaign.findUnique({ where: { id } });
      if (!c) throw new HttpError(404, "NOT_FOUND", "Campanha não encontrada.");
      m.checkVersion(c.version, input.version);
      await tx.campaign.update({
        where: { id },
        data: {
          status: input.status,
          archivedAt: input.status === "ARCHIVED" ? new Date() : null,
          version: { increment: 1 },
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor,
          action: "CAMPAIGN_STATUS_CHANGED",
          targetId: id,
          reason: input.reason,
        },
      });
      return { status: input.status };
    },
  );
  managementRoute(
    "patch",
    "/api/admin/campaigns/:id/members/:userId/role",
    s.memberRoleSchema,
    globalAdmin,
    async (tx, actor, input, req, res) => {
      await m.consumeProof(
        tx,
        actor,
        res.locals.sessionId,
        req.get("X-Admin-Authorization"),
      );
      const campaignId = uuid(req.params.id),
        userId = uuid(req.params.userId);
      await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${campaignId} FOR UPDATE`;
      const member = await tx.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
        include: { user: true },
      });
      if (!member || member.status !== "ACTIVE" || member.user.disabledAt)
        throw new HttpError(404, "NOT_FOUND", "Membro ativo não encontrado.");
      m.checkVersion(member.version, input.version);
      if (
        input.role === "GM" &&
        !member.user.canCreateCampaigns &&
        member.user.role !== "ADMIN"
      )
        throw new HttpError(
          400,
          "GM_ELIGIBILITY",
          "Habilite primeiro a criação de campanhas dessa conta.",
        );
      if (
        member.role === "GM" &&
        input.role === "PLAYER" &&
        (await tx.campaignMember.count({
          where: {
            campaignId,
            role: "GM",
            status: "ACTIVE",
            user: { disabledAt: null },
          },
        })) <= 1
      )
        throw new HttpError(409, "LAST_GM", "Mantenha ao menos um GM ativo.");
      await tx.campaignMember.update({
        where: { id: member.id },
        data: { role: input.role, version: { increment: 1 } },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor,
          action: "CAMPAIGN_ROLE_CHANGED",
          targetId: member.id,
          reason: input.reason,
        },
      });
      await m.campaignLog(
        tx,
        campaignId,
        actor,
        "CAMPAIGN_ROLE_CHANGED",
        userId,
        { role: member.role },
        { role: input.role },
        input.reason,
      );
      return { role: input.role };
    },
  );
  app.get("/api/admin/audit", auth, admin, async (_req, res) =>
    res.json({
      entries: await db.adminAuditLog.findMany({
        select: {
          id: true,
          action: true,
          targetId: true,
          reason: true,
          createdAt: true,
          actor: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    }),
  );
  app.get("/api/admin/settings", auth, admin, async (_req, res) =>
    res.json({
      settings: await db.platformSettings.findUniqueOrThrow({
        where: { id: "global" },
      }),
    }),
  );
  managementRoute(
    "patch",
    "/api/admin/settings",
    s.settingsSchema,
    globalAdmin,
    async (tx, actor, input, req, res) => {
      await m.consumeProof(
        tx,
        actor,
        res.locals.sessionId,
        req.get("X-Admin-Authorization"),
      );
      const settings = await tx.platformSettings.findUniqueOrThrow({
        where: { id: "global" },
      });
      m.checkVersion(settings.version, input.version);
      await tx.platformSettings.update({
        where: { id: "global" },
        data: {
          registrationOpen: input.registrationOpen,
          campaignCreationEnabled: input.campaignCreationEnabled,
          version: { increment: 1 },
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor,
          action: "PLATFORM_SETTINGS_CHANGED",
          targetId: "global",
          reason: input.reason,
        },
      });
      return { saved: true };
    },
  );
  app.get("/api/admin/gm-invites", auth, admin, async (_req, res) =>
    res.json({
      invites: await db.privilegeInvite.findMany({
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          usedAt: true,
          revokedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    }),
  );
  const privilegedInviteSchema = z
    .object({
      operationId: z.uuid().default(() => randomUUID()),
      expiresInHours: z.number().int().min(1).max(168),
    })
    .strict();
  managementRoute(
    "post",
    "/api/admin/gm-invites",
    privilegedInviteSchema,
    globalAdmin,
    async (tx, actor, input) => {
      const code = randomToken();
      const invite = await tx.privilegeInvite.create({
        data: {
          createdById: actor,
          codeHash: tokenHash(code),
          expiresAt: new Date(Date.now() + input.expiresInHours * 3600000),
        },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor,
          action: "GM_INVITE_CREATED",
          targetId: invite.id,
        },
      });
      return { invite: { id: invite.id, expiresAt: invite.expiresAt }, code };
    },
  );
  app.delete("/api/admin/gm-invites/:id", auth, admin, async (req, res) => {
    const id = uuid(req.params.id);
    await db.$transaction(async (tx) => {
      await m.administration(tx, res.locals.user.id);
      const changed = await tx.privilegeInvite.updateMany({
        where: { id, usedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (!changed.count)
        throw new HttpError(
          409,
          "INVITE_UNAVAILABLE",
          "Convite inexistente ou indisponível.",
        );
      await tx.adminAuditLog.create({
        data: {
          actorId: res.locals.user.id,
          action: "GM_INVITE_REVOKED",
          targetId: id,
        },
      });
    });
    res.status(204).end();
  });
}
