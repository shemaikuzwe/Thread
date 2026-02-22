import { db } from "@thread/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "src/env";
const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/v1/auth",
  trustedOrigins: [env.CLIENT_APP_URL],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});
const signOut = async () => await auth.api.signOut();
const getSession = async () => await auth.api.getSession();

type Session = typeof auth.$Infer.Session;
type User = typeof auth.$Infer.Session.user;
export { auth, type Session, type User, signOut, getSession };
