import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";
import type { UploadRouter } from "@/pages/api.uploadthing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const { useUploadThing } = generateReactHelpers<UploadRouter>();
export const UploadButton = generateUploadButton<UploadRouter>();

export async function sleep(sec: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, 1000 * sec));
}
