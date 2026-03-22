import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
const { useSession, signIn, signOut, $Infer, signUp, getSession,token } = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1/auth`,
  plugins: [jwtClient()],
});
type Session = typeof $Infer.Session;
type User = typeof $Infer.Session.user;

export { useSession, signIn, signOut, type Session, type User, signUp, getSession ,token};
