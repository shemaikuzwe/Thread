import { z } from "zod";
const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  SERVICE_URL: z.string(),
  RABBITMQ_URL: z.url(),
  DATABASE_URL: z.url(),
});

export const env = envSchema.parse(process.env);
