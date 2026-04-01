import { db } from "@thread/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins/jwt";
import { env } from "src/env";
import { account, user, verification, session, jwks } from "@thread/db";
import { bearer } from "better-auth/plugins";

const authSchema = {
  account,
  user,
  verification,
  session,
  jwks,
};
const clientAppUrl = new URL(env.CLIENT_APP_URL);
const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  advanced: {
    useSecureCookies: false,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
    // crossSubDomainCookies: {
    //   enabled: true,
    //   domain: clientAppUrl.hostname,
    // },
  },
  account:{
    //setting cookie fails
    skipStateCookieCheck: true,
  },
  baseURL: env.API_BASE_URL,
  basePath: "/v1/auth",
  trustedOrigins: [clientAppUrl.origin],
  plugins: [
    jwt({
      jwt: {
        expirationTime: "5m",
      },
    }),
    bearer()
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
