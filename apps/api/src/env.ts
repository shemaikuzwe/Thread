import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string(),
  PORT: z.coerce.number(),
  NODE_ENV: z.enum(["development", "production", "test"]),
  CLIENT_APP_URL: z.url(),
  REDIS_URL: z.url(),
  VAPID_PUBLIC_KEY: z.string(),
  VAPID_PRIVATE_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
