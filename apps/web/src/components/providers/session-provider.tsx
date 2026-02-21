import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@/lib/types";
import { api } from "@/lib/axios";

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    async function main() {
      try {
        setSession({ status: "pending", user: null });
        const res = await api.get("/auth/session");
        if (res.status !== 200) {
          setSession(null);
          return;
        }
        setSession(res.data);
      } catch (err) {
        console.log("error", err);
        setSession({ status: "un_authenticated", user: null });
      }
    }
    main();
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
