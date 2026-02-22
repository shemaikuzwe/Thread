import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_APP_URL: z.url(),
  REDIS_URL: z.url(),
  VAPID_PUBLIC_KEY: z.string(),
  VAPID_PRIVATE_KEY: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  BETTER_AUTH_URL:z.url()
});

export const env = envSchema.parse(process.env);
