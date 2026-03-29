import { z } from "zod";
export const envSchema = z.object({
  S3_BUCKET: z.string(),
  S3_ENDPOINT: z.string(),
  REGION: z.string(),
  STORAGE_ACCESS_KEY_ID: z.string(),
  STORAGE_SECRET_ACCESS_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
