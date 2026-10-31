import { createContext, useContext, useMemo, type ReactNode } from "react";
import { api as baseApi } from "../api";
const ClientContext = createContext<{ api: typeof baseApi; gm: boolean }>({
  api: baseApi,
  gm: false,
});
export const useSheetClient = () => useContext(ClientContext);
export function SheetClientProvider({
  gm,
  children,
}: {
  gm: boolean;
  children: ReactNode;
}) {
  const client = useMemo(
    () => ({
      gm,
      api: ((path: string, init: RequestInit = {}) => {
        const headers = new Headers(init.headers);
        if (gm) headers.set("X-View-Context", "gm");
        return baseApi(path, { ...init, headers });
      }) as typeof baseApi,
    }),
    [gm],
  );
  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  );
}
