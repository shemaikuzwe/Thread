import { createAuthClient } from "better-auth/react";

const { useSession, signIn, signOut, $Infer, signUp,getSession } = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/auth`,
});
type Session = typeof $Infer.Session;
export { useSession, signIn, signOut, type Session, signUp,getSession };
