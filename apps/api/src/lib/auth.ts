import { db } from "@thread/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins/jwt";
import { env } from "src/env";
import { account, user, verification, session, jwks } from "@thread/db";

const authSchema = {
  account,
  user,
  verification,
  session,
  jwks,
};

const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  baseURL: env.API_BASE_URL,
  basePath: "/v1/auth",
  trustedOrigins: [env.CLIENT_APP_URL],
  plugins: [
    jwt({
      jwt: {
        expirationTime: "5m",
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 4,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
});
const signOut = async () => await auth.api.signOut();
const getSession = async () => await auth.api.getSession();

type Session = typeof auth.$Infer.Session;
type User = typeof auth.$Infer.Session.user;
export { auth, type Session, type User, signOut, getSession };
