import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  recoverySchema,
  characterCreateSchema,
  characterUpdateSchema,
  type PublicUser,
} from "../../../packages/shared/src/index.js";
import type { Config } from "./config.js";
import {
  hashPassword,
  verifyPassword,
  randomToken,
  tokenHash,
  issueCsrf,
  validCsrf,
  publicUser,
} from "./security.js";

import { HttpError } from "./errors.js";
import { initializeSheet } from "./sheet-service.js";
import { mountGameRoutes } from "./game-routes.js";
import { mountSheetRoutes } from "./sheet-routes.js";
import { mountManagementRoutes } from "./management-routes.js";
const unauthorized = () =>
  new HttpError(401, "UNAUTHENTICATED", "Entre na sua conta para continuar.");
const characterSelect = {
  id: true,
  name: true,
  concept: true,
  status: true,
  rulesVersion: true,
  version: true,
  updatedAt: true,
  campaignId: true,
} satisfies Prisma.CharacterSelect;
const idSchema = z.uuid();
export function createApp(db: PrismaClient, c: Config) {
  const app = express();
  const prod = c.NODE_ENV === "production";
  const sessionCookie = prod ? "__Host-hibrido-session" : "hibrido-session";
  const csrfCookie = prod ? "__Host-hibrido-csrf" : "hibrido-csrf";
  const cookieOptions = {
    httpOnly: true,
    secure: prod,
    sameSite: "lax" as const,
    path: "/",
  };
  const dummyHash = hashPassword(randomToken());
  app.disable("x-powered-by");
  app.set("trust proxy", c.TRUST_PROXY === "1" ? 1 : false);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          ...(prod ? {} : { upgradeInsecureRequests: null }),
        },
      },
    }),
  );
  app.use((req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader("X-Request-Id", res.locals.requestId);
    if (req.path.startsWith("/api")) res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "128kb" }));
  app.use(cookieParser());
  const gameRequest = (req: Request) =>
    /^\/api\/sessions(?:\/|$)/.test(
      req.originalUrl.split("?")[0] ?? req.path,
    ) ||
    /^\/api\/campaigns\/[^/]+\/sessions$/.test(
      req.originalUrl.split("?")[0] ?? req.path,
    );
  const limit = (max: number, windowMs: number, perActor = false) =>
    rateLimit({
      windowMs,
      limit: (req, res) =>
        perActor && res.locals.rateLimitUserId && gameRequest(req) ? 2400 : max,
      ...(perActor
        ? {
            keyGenerator: (req: Request, res: Response) =>
              res.locals.rateLimitUserId
                ? (gameRequest(req) ? "game:" : "api:") +
                  res.locals.rateLimitUserId
                : ipKeyGenerator(req.ip ?? "127.0.0.1"),
          }
        : {}),
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: {
          code: "RATE_LIMITED",
          message: "Muitas tentativas. Aguarde e tente novamente.",
        },
      },
    });
  // Borda por IP e limite autenticado: um grupo atrás do mesmo Wi-Fi não divide a cota de uma conta.
  app.use("/api", limit(12000, 15 * 60_000));
  app.use("/api", async (req, res, next) => {
    const token = req.cookies[sessionCookie];
    if (typeof token === "string" && token.length <= 100) {
      const session = await db.session.findUnique({
        where: { tokenHash: tokenHash(token) },
        include: { user: true },
      });
      if (
        session &&
        session.expiresAt > new Date() &&
        session.idleExpiresAt > new Date() &&
        !session.user.disabledAt
      ) {
        res.locals.authSession = session;
        res.locals.rateLimitUserId = session.userId;
      }
    }
    next();
  });
  app.use("/api", limit(600, 15 * 60_000, true));
  const credentialLimit = limit(40, 15 * 60_000);
  app.use("/api/auth", (req, res, next) =>
    req.method === "POST" &&
    ["/register", "/login", "/recover"].includes(req.path)
      ? credentialLimit(req, res, next)
      : next(),
  );
  // Uma segunda chave reduz tentativas distribuídas contra o mesmo login; somente hash na memória.
  const accountLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 12,
    keyGenerator: (req) =>
      tokenHash(
        String(req.body?.username ?? "")
          .trim()
          .toLowerCase(),
      ),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message: "Muitas tentativas para esta conta. Aguarde.",
      },
    },
  });
  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (
      req.get("origin") !== c.APP_ORIGIN ||
      !validCsrf(
        req.cookies[csrfCookie],
        req.get("x-csrf-token"),
        c.CSRF_SECRET,
      )
    )
      return next(
        new HttpError(
          403,
          "CSRF_INVALID",
          "A sessão de segurança expirou. Recarregue a página.",
        ),
      );
    next();
  });
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/ready", async (_req, res) => {
    try {
      await db.$queryRaw`SELECT 1`;
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.get("/api/auth/csrf", (_req, res) => {
    const csrfToken = issueCsrf(c.CSRF_SECRET);
    res.cookie(csrfCookie, csrfToken, {
      ...cookieOptions,
      maxAge: 2 * 60 * 60_000,
    });
    res.json({ csrfToken });
  });
  async function startSession(
    tx: Prisma.TransactionClient,
    userId: string,
    res: Response,
  ) {
    const token = randomToken();
    const now = Date.now();
    await tx.session.create({
      data: {
        userId,
        tokenHash: tokenHash(token),
        expiresAt: new Date(now + 7 * 86400_000),
        idleExpiresAt: new Date(now + 12 * 3600_000),
      },
    });
    return () =>
      res.cookie(sessionCookie, token, {
        ...cookieOptions,
        maxAge: 7 * 86400_000,
      });
  }
  const auth = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies[sessionCookie];
    if (typeof token !== "string" || token.length > 100) throw unauthorized();
    const session =
      (res.locals.authSession as
        | Prisma.SessionGetPayload<{ include: { user: true } }>
        | undefined) ??
      (await db.session.findUnique({
        where: { tokenHash: tokenHash(token) },
        include: { user: true },
      }));
    if (
      !session ||
      session.expiresAt <= new Date() ||
      session.idleExpiresAt <= new Date() ||
      session.user.disabledAt
    )
      throw unauthorized();
    // Atualiza apenas expiração; nunca recria sessão revogada.
    const active = await db.session.updateMany({
      where: { id: session.id },
      data: { idleExpiresAt: new Date(Date.now() + 12 * 3600_000) },
    });
    if (!active.count) throw unauthorized();
    res.locals.user = publicUser(session.user);
    res.locals.sessionId = session.id;
    next();
  };
  const admin = (req: Request, res: Response, next: NextFunction) => {
    if ((res.locals.user as PublicUser).role !== "ADMIN")
      throw new HttpError(
        403,
        "FORBIDDEN",
        "Acesso reservado ao administrador.",
      );
    next();
  };
  app.post("/api/auth/register", accountLimit, async (req, res) => {
    const input = registerSchema.parse(req.body);
    const recoveryCodes = Array.from({ length: 8 }, () => randomToken());
    const passwordHash = await hashPassword(input.password);
    const result = await db.$transaction(async (tx) => {
      let privileged = false;
      if (input.inviteCode) {
        const invite = await tx.privilegeInvite.updateMany({
          where: {
            codeHash: tokenHash(input.inviteCode),
            usedAt: null,
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { usedAt: new Date() },
        });
        if (invite.count !== 1)
          throw new HttpError(
            400,
            "INVITE_INVALID",
            "Convite inválido, expirado ou já utilizado.",
          );
        privileged = true;
      }
      const settings = await tx.platformSettings.findUnique({
        where: { id: "global" },
      });
      if (settings && !settings.registrationOpen)
        throw new HttpError(
          403,
          "REGISTRATION_CLOSED",
          "O cadastro público está fechado.",
        );
      const user = await tx.user.create({
        data: {
          username: input.username,
          passwordHash,
          canCreateCampaigns: privileged,
          recoveryCodes: {
            create: recoveryCodes.map((code) => ({
              codeHash: tokenHash(code),
            })),
          },
          ...(input.characterName
            ? {
                characters: {
                  create: { name: input.characterName, concept: "" },
                },
              }
            : {}),
        },
      });
      if (privileged)
        await tx.adminAuditLog.create({
          data: {
            actorId: user.id,
            action: "GM_PERMISSION_GRANTED_BY_INVITE",
            targetId: user.id,
          },
        });
      const initial = await tx.character.findFirst({
        where: { ownerId: user.id },
      });
      if (initial) await initializeSheet(tx, initial.id);
      if (initial)
        await tx.characterAuditLog.create({
          data: {
            actorId: user.id,
            characterId: initial.id,
            action: "CHARACTER_CREATED",
            recordVersion: 1,
          },
        });
      return {
        user: publicUser(user),
        commitCookie: await startSession(tx, user.id, res),
      };
    });
    result.commitCookie();
    res.status(201).json({ user: result.user, recoveryCodes });
  });
  app.post("/api/auth/login", accountLimit, async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await db.user.findUnique({
      where: { username: input.username },
    });
    const valid = await verifyPassword(
      user?.passwordHash ?? (await dummyHash),
      input.password,
    );
    if (!user || !valid || user.disabledAt)
      throw new HttpError(
        401,
        "INVALID_CREDENTIALS",
        "Usuário ou senha inválidos.",
      );
    const commitCookie = await db.$transaction(async (tx) => {
      const previous = req.cookies[sessionCookie];
      if (typeof previous === "string")
        await tx.session.deleteMany({
          where: { tokenHash: tokenHash(previous) },
        });
      return startSession(tx, user.id, res);
    });
    commitCookie();
    res.json({ user: publicUser(user) });
  });
  app.post("/api/auth/recover", accountLimit, async (req, res) => {
    const input = recoverySchema.parse(req.body);
    const passwordHash = await hashPassword(input.password);
    await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { username: input.username },
      });
      if (!user || user.disabledAt)
        throw new HttpError(
          400,
          "RECOVERY_INVALID",
          "Não foi possível recuperar a conta com esses dados.",
        );
      const claimed = await tx.recoveryCode.updateMany({
        where: {
          userId: user.id,
          codeHash: tokenHash(input.recoveryCode),
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1)
        throw new HttpError(
          400,
          "RECOVERY_INVALID",
          "Não foi possível recuperar a conta com esses dados.",
        );
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, version: { increment: 1 } },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "ACCOUNT_RECOVERED",
          targetId: user.id,
        },
      });
    });
    res.clearCookie(sessionCookie, cookieOptions);
    res.json({ message: "Senha alterada. Entre novamente." });
  });
  app.get("/api/auth/me", auth, (_req, res) =>
    res.json({ user: res.locals.user }),
  );
  app.post("/api/auth/logout", async (req, res) => {
    const token = req.cookies[sessionCookie];
    if (typeof token === "string")
      await db.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
    res.clearCookie(sessionCookie, cookieOptions);
    res.status(204).end();
  });
  app.get("/api/characters", auth, async (_req, res) => {
    res.json({
      characters: await db.character.findMany({
        where: { ownerId: res.locals.user.id, archivedAt: null },
        select: characterSelect,
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
    });
  });
  app.post("/api/characters", auth, async (req, res) => {
    const input = characterCreateSchema.parse(req.body);
    const character = await db.$transaction(async (tx) => {
      const ch = await tx.character.create({
        data: { name: input.name, concept: "", ownerId: res.locals.user.id },
        select: characterSelect,
      });
      await initializeSheet(tx, ch.id);
      await tx.characterAuditLog.create({
        data: {
          actorId: res.locals.user.id,
          characterId: ch.id,
          action: "CHARACTER_CREATED",
          recordVersion: ch.version,
        },
      });
      return ch;
    });
    res.status(201).json({ character });
  });
  // Na etapa 1 somente o proprietário pode consultar/editar. Acesso por campanha será habilitado com os testes da etapa 3.
  app.get("/api/characters/:id", auth, async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const character = await db.character.findFirst({
      where: { id, ownerId: res.locals.user.id, archivedAt: null },
      select: characterSelect,
    });
    if (!character)
      throw new HttpError(404, "NOT_FOUND", "Ficha não encontrada.");
    res.json({ character });
  });
  app.patch("/api/characters/:id", auth, async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = characterUpdateSchema.parse(req.body);
    const character = await db.$transaction(async (tx) => {
      const updated = await tx.character.updateMany({
        where: {
          id,
          ownerId: res.locals.user.id,
          version: input.version,
          archivedAt: null,
          status: { not: "ARCHIVED" },
        },
        data: {
          name: input.name,
          concept: input.concept,
          identityVersion: { increment: 1 },
          version: { increment: 1 },
        },
      });
      if (!updated.count) {
        const exists = await tx.character.findFirst({
          where: { id, ownerId: res.locals.user.id, archivedAt: null },
          select: { id: true },
        });
        throw exists
          ? new HttpError(
              409,
              "VERSION_CONFLICT",
              "Esta ficha mudou em outro dispositivo. Recarregue os dados antes de salvar.",
            )
          : new HttpError(404, "NOT_FOUND", "Ficha não encontrada.");
      }
      const ch = await tx.character.findUniqueOrThrow({
        where: { id },
        select: characterSelect,
      });
      await tx.characterAuditLog.create({
        data: {
          characterId: id,
          actorId: res.locals.user.id,
          action: "IDENTITY_UPDATED",
          recordVersion: ch.version,
        },
      });
      return ch;
    });
    res.json({ character });
  });
  mountGameRoutes(app, db, auth);
  mountManagementRoutes(app, db, auth, admin);
  mountSheetRoutes(app, db, auth, c.PORTRAIT_MAX_BYTES);
  app.use("/api", (_req, _res, next) =>
    next(new HttpError(404, "NOT_FOUND", "Rota não encontrada.")),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof z.ZodError)
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Revise os campos informados.",
            fields: error.flatten().fieldErrors,
          },
        });
      if (error instanceof HttpError)
        return res
          .status(error.status)
          .json({ error: { code: error.code, message: error.message } });
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        return res.status(409).json({
          error: {
            code: "CONFLICT",
            message: "Não foi possível concluir: registro já existente.",
          },
        });
      const malformed =
        error instanceof SyntaxError &&
        "status" in error &&
        error.status === 400;
      const tooLarge =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        error.status === 413;
      if (malformed || tooLarge)
        return res.status(tooLarge ? 413 : 400).json({
          error: { code: "INVALID_REQUEST", message: "Requisição inválida." },
        });
      console.error(
        JSON.stringify({
          event: "request_failed",
          requestId: res.locals.requestId,
          category:
            error instanceof Prisma.PrismaClientKnownRequestError
              ? "database"
              : "internal",
        }),
      );
      return res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Serviço indisponível. Tente novamente.",
          requestId: res.locals.requestId,
        },
      });
    },
  );
  return app;
}
