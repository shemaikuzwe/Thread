import { createContext, use, useEffect, useState } from "react";
import type { Session } from "@/lib/types";

const SessionContext = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  // TODO:test react query

  useEffect(() => {
    async function getSession() {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/session`);
      if (!res.ok) {
        setSession(null);
      }
      const data = await res.json();
      setSession(data);
    }
    getSession();
  }, []);
  console.log(session);

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = use(SessionContext);
  return session;
}
