import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { api } from "../api";
import { ErrorBox } from "../components";
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<{
        notifications: {
          id: string;
          message: string;
          linkPath: string;
          readAt: string | null;
          createdAt: string;
        }[];
        unread: number;
      }>("/notifications"),
    refetchInterval: 30000,
  });
  const mutation = useMutation({
    mutationFn: (id: string) =>
      api("/notifications/" + id, { method: "PATCH", body: "{}" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  return (
    <div className="notifications">
      <button
        className="notification-toggle"
        aria-label="Notificações"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Bell size={17} />
        {Boolean(query.data?.unread) && <span>{query.data?.unread}</span>}
      </button>
      {open && (
        <div className="notification-menu">
          <h2>Notificações</h2>
          <ErrorBox error={query.error} />
          <ErrorBox error={mutation.error} />
          {query.data?.notifications.map((n) => (
            <article key={n.id} className={n.readAt ? "read" : ""}>
              <Link to={n.linkPath} onClick={() => setOpen(false)}>
                {n.message}
                <small>{new Date(n.createdAt).toLocaleString("pt-BR")}</small>
              </Link>
              {!n.readAt && (
                <button
                  className="icon-button"
                  aria-label="Marcar notificação como lida"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(n.id)}
                >
                  <Check size={15} />
                </button>
              )}
            </article>
          ))}
          {query.data?.notifications.length === 0 && (
            <p>Nenhuma notificação.</p>
          )}
        </div>
      )}
    </div>
  );
}
