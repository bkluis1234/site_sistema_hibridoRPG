export const transitions = {
  SCHEDULED: { start: "ACTIVE", cancel: "CANCELLED" },
  ACTIVE: { pause: "PAUSED", finish: "FINISHED" },
  PAUSED: { resume: "ACTIVE", finish: "FINISHED" },
  FINISHED: {},
  CANCELLED: {},
} as const;
export function nextGameStatus(current: string, action: string): string | null {
  return (
    (transitions as Record<string, Record<string, string>>)[current]?.[
      action
    ] ?? null
  );
}
export function connectionPresence(
  records: { lastSeenAt: Date; away: boolean }[],
  now: Date = new Date(),
): "ONLINE" | "AWAY" | "OFFLINE" {
  if (
    records.some(
      (r) => !r.away && now.getTime() - r.lastSeenAt.getTime() < 45000,
    )
  )
    return "ONLINE";
  return records.some((r) => now.getTime() - r.lastSeenAt.getTime() < 90000)
    ? "AWAY"
    : "OFFLINE";
}
