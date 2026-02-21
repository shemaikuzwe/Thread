import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";
import type { UploadRouter } from "@/app/api/uploadthing/route";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const { useUploadThing } = generateReactHelpers<UploadRouter>();
export const UploadButton = generateUploadButton<UploadRouter>();

export async function sleep(sec: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, 1000 * sec));
}
export function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  const size = sizeInBytes / Math.pow(1024, i);
  return `${size.toFixed(2)} ${units[i]}`;
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
