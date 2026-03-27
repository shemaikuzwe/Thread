import { z } from "zod";
const envSchema = z.object({
  SERVICE_URL: z.url(),
  RABBITMQ_URL: z.url(),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  CLIENT_APP_URL: z.url(),
  PORT: z.coerce.number(),
});

export const env = envSchema.parse(process.env);
