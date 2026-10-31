import type { PrismaClient } from "@prisma/client";
export async function cleanupUsers(db: PrismaClient, names: string[]) {
  const users = await db.user.findMany({
    where: { username: { in: names } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  const chars = await db.character.findMany({
    where: { ownerId: { in: ids } },
    select: { id: true },
  });
  const characterIds = chars.map((c) => c.id);
  const where = { characterId: { in: characterIds } };
  const ownedCampaigns = await db.campaign.findMany({
    where: { ownerId: { in: ids } },
    select: { id: true },
  });
  const campaignIds = ownedCampaigns.map((c) => c.id);
  const games = await db.gameSession.findMany({
    where: { campaignId: { in: campaignIds } },
    select: { id: true },
  });
  const gameIds = games.map((g) => g.id);
  await db.itemTransfer.deleteMany({
    where: {
      OR: [
        { gameSessionId: { in: gameIds } },
        { requesterId: { in: ids } },
        { sourceCharacterId: { in: characterIds } },
        { destinationCharacterId: { in: characterIds } },
      ],
    },
  });
  await db.sessionEvent.deleteMany({
    where: {
      OR: [
        { gameSessionId: { in: gameIds } },
        { authorId: { in: ids } },
        { recipientId: { in: ids } },
        { ownerId: { in: ids } },
        { characterId: { in: characterIds } },
      ],
    },
  });
  await db.sessionNote.deleteMany({
    where: {
      OR: [{ gameSessionId: { in: gameIds } }, { authorId: { in: ids } }],
    },
  });
  await db.presenceRecord.deleteMany({
    where: {
      OR: [{ gameSessionId: { in: gameIds } }, { userId: { in: ids } }],
    },
  });
  await db.sessionParticipant.deleteMany({
    where: {
      OR: [
        { gameSessionId: { in: gameIds } },
        { userId: { in: ids } },
        { characterId: { in: characterIds } },
      ],
    },
  });
  await db.diceRoll.deleteMany({ where: { gameSessionId: { in: gameIds } } });
  await db.gameSession.deleteMany({ where: { id: { in: gameIds } } });
  await db.adminAuthorization.deleteMany({ where: { userId: { in: ids } } });
  await db.managementOperation.deleteMany({ where: { actorId: { in: ids } } });
  await db.notification.deleteMany({ where: { userId: { in: ids } } });
  await db.characterNote.deleteMany({
    where: {
      OR: [
        where,
        { authorId: { in: ids } },
        { campaignId: { in: campaignIds } },
      ],
    },
  });
  await db.campaignAuditLog.deleteMany({
    where: {
      OR: [{ campaignId: { in: campaignIds } }, { actorId: { in: ids } }],
    },
  });

  await db.diceRoll.deleteMany({
    where: {
      OR: [
        where,
        { userId: { in: ids } },
        { retryAuthorizedById: { in: ids } },
      ],
    },
  });
  await db.characterOperation.deleteMany({ where });
  await db.characterAuditLog.deleteMany({
    where: { OR: [where, { actorId: { in: ids } }] },
  });
  await db.adminAuditLog.deleteMany({ where: { actorId: { in: ids } } });
  await db.characterChangeRequest.deleteMany({ where });
  await db.characterWeapon.deleteMany({ where });
  await db.inventoryItem.deleteMany({ where });
  await db.characterInjury.deleteMany({ where });
  await db.characterCondition.deleteMany({ where });
  await db.characterConditionState.deleteMany({ where });
  await db.characterResource.deleteMany({ where });
  await db.characterSkill.deleteMany({ where });
  await db.characterAttribute.deleteMany({ where });
  await db.character.deleteMany({ where: { id: { in: characterIds } } });
  const campaigns = await db.campaign.findMany({
    where: { ownerId: { in: ids } },
    select: { id: true },
  });
  const campaignsWhere = { campaignId: { in: campaigns.map((c) => c.id) } };
  await db.campaignInvite.deleteMany({ where: campaignsWhere });
  await db.campaignMember.deleteMany({
    where: { OR: [campaignsWhere, { userId: { in: ids } }] },
  });
  await db.campaign.deleteMany({ where: { ownerId: { in: ids } } });
  await db.privilegeInvite.deleteMany({ where: { createdById: { in: ids } } });
  await db.recoveryCode.deleteMany({ where: { userId: { in: ids } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}
