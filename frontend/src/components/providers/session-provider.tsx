import { createContext, useContext } from "react";
import type { Session } from "@/lib/types";

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  console.log(session);
  return session;
}
