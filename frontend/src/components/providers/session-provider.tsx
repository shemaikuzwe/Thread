import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@/lib/types";
import { api } from "@/lib/axios";

const SessionContext = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  // TODO:test react query

  useEffect(() => {
    async function getSession() {
      const res = await api.get("/auth/session");
      if (!res.status) {
        setSession(null);
      }
      const data = res.data;
      setSession(data);
    }
    getSession();
  }, []);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  return session;
}
