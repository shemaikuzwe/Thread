import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";
import type { UploadRouter } from "@/routes/api.uploadthing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const { useUploadThing } = generateReactHelpers<UploadRouter>();
export const UploadButton = generateUploadButton<UploadRouter>();
