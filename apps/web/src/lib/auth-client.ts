import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";
import cookieJs from "js-cookie";

const { useSession, signIn, signOut, $Infer, signUp, getSession, token } = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/v1/auth`,
  plugins: [jwtClient()],
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        cookieJs.set("auth.token", authToken);
      }
    },
    auth: {
      type: "Bearer",
      token: () => cookieJs.get("auth.token"),
    },
  },
});
type Session = typeof $Infer.Session;
type User = typeof $Infer.Session.user;

export { useSession, signIn, signOut, type Session, type User, signUp, getSession, token };
