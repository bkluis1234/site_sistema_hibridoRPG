import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { ConnectionState } from "../../../../packages/shared/src/index";
import { eventLabels } from "./types";
export function useSessionSync(
  id: string | undefined,
  gm: boolean,
  enabled: boolean,
  joined: boolean,
  open: boolean,
) {
  const qc = useQueryClient(),
    [connection, setConnection] = useState<ConnectionState>("connecting"),
    [notice, setNotice] = useState(""),
    [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  mutedRef.current = muted;
  useEffect(() => {
    if (!id || !enabled) return;
    let disposed = false,
      source: EventSource | null = null,
      retryTimer: ReturnType<typeof setTimeout> | undefined,
      refreshTimer: ReturnType<typeof setTimeout> | undefined,
      failures = 0,
      lastId: string | undefined;
    const seen = new Set<string>(),
      types = new Set<string>();
    const headers = gm ? { "X-View-Context": "gm" } : {};
    const refresh = () => {
      void qc.invalidateQueries({ queryKey: ["game", id] });
      void qc.invalidateQueries({ queryKey: ["sheet"] });
    };
    const flush = () => {
      refreshTimer = undefined;
      void qc.invalidateQueries({ queryKey: ["game", id, "events"] });
      if ([...types].some((t) => t.startsWith("ROLL_")))
        void qc.invalidateQueries({ queryKey: ["game", id, "rolls"] });
      if ([...types].some((t) => t.startsWith("NOTE_")))
        void qc.invalidateQueries({ queryKey: ["game", id, "notes"] });
      if (
        [...types].some((t) => !t.startsWith("NOTE_") && !t.startsWith("ROLL_"))
      ) {
        void qc.invalidateQueries({ queryKey: ["game", id, "detail"] });
        void qc.invalidateQueries({ queryKey: ["game", id, "sheet"] });
        void qc.invalidateQueries({ queryKey: ["game", id, "transfers"] });
        void qc.invalidateQueries({ queryKey: ["game", id, "summary"] });
        void qc.invalidateQueries({ queryKey: ["sheet"] });
      }
      types.clear();
    };
    const connect = () => {
      if (disposed) return;
      if (!navigator.onLine) {
        setConnection("offline");
        return;
      }
      source?.close();
      if (!("EventSource" in window)) {
        setConnection("polling");
        return;
      }
      setConnection(failures ? "reconnecting" : "connecting");
      source = new EventSource(
        "/api/sessions/" +
          id +
          "/stream?context=" +
          (gm ? "gm" : "player") +
          (lastId ? "&after=" + encodeURIComponent(lastId) : ""),
      );
      source.onopen = () => {
        if (disposed) return;
        failures = 0;
        setConnection("live");
        refresh();
      };
      source.addEventListener("change", (message) => {
        try {
          const value = JSON.parse((message as MessageEvent).data) as {
            eventId: string;
            type: string;
          };
          if (
            typeof value.eventId !== "string" ||
            typeof value.type !== "string" ||
            seen.has(value.eventId)
          )
            return;
          seen.add(value.eventId);
          if (seen.size > 1000) seen.delete(seen.values().next().value!);
          lastId = value.eventId;
          types.add(value.type);
          if (!mutedRef.current)
            setNotice(eventLabels[value.type] ?? "Atualização disponível.");
          if (!refreshTimer) refreshTimer = setTimeout(flush, 250);
        } catch {
          /* Snapshot REST continua autoritativo. */
        }
      });
      source.onerror = () => {
        if (disposed) return;
        failures++;
        setConnection(navigator.onLine ? "reconnecting" : "offline");
        if (failures >= 3) {
          source?.close();
          setConnection(navigator.onLine ? "polling" : "offline");
          retryTimer = setTimeout(connect, 30000);
        }
      };
    };
    const online = () => {
      lastId = undefined;
      refresh();
      connect();
    };
    const offline = () => {
      source?.close();
      setConnection("offline");
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    connect();
    return () => {
      disposed = true;
      source?.close();
      clearTimeout(retryTimer);
      clearTimeout(refreshTimer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [id, gm, enabled, qc]);
  useEffect(() => {
    if (!id || !enabled || !joined || !open) return;
    const clientId = crypto.randomUUID();
    let disposed = false;
    const beat = () => {
      if (disposed || !navigator.onLine) return;
      void api("/sessions/" + id + "/heartbeat", {
        method: "POST",
        body: JSON.stringify({ clientId, away: document.hidden }),
      }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 20000);
    document.addEventListener("visibilitychange", beat);
    window.addEventListener("online", beat);
    return () => {
      disposed = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", beat);
      window.removeEventListener("online", beat);
    };
  }, [id, enabled, joined, open]);
  const polling: number | false = connection === "live" ? false : 15000;
  return { connection, notice, muted, setMuted, polling };
}
