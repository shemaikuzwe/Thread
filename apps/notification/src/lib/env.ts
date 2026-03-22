import { z } from "zod";
const envSchema = z.object({
  CLIENT_APP_URL: z.url(),
  RABBITMQ_URL: z.url(),
  VAPID_PUBLIC_KEY: z.string(),
  VAPID_PRIVATE_KEY: z.string(),
  PORT: z.coerce.number(),
});

export const env = envSchema.parse(process.env);
