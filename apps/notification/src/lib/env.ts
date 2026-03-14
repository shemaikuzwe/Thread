import { z } from "zod";
const envSchema = z.object({
  SERVICE_URL: z.url(),
  VAPID_PUBLIC_KEY: z.string(),
  VAPID_PRIVATE_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
