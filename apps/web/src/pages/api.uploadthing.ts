import { createRouteHandler, createUploadthing } from "uploadthing/remix";
import { UploadThingError } from "uploadthing/server";
import type { FileRouter } from "uploadthing/types";
import { auth } from "@/lib/server";

const f = createUploadthing();

export const uploadRouter = {
  media: f({
    image: { maxFileSize: "4MB" },
    video: { maxFileSize: "16MB" },
    audio: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "64MB" },
    text: { maxFileSize: "64KB" },
    blob: { maxFileSize: "64MB" },
  })
    .middleware(async ({ event }) => {
      const session = await auth(event.request);
      if (session.status !== "authenticated" || !session.user) {
        throw new UploadThingError("User not found");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

const handler = createRouteHandler({ router: uploadRouter });
export const loader = handler.loader;
export const action = handler.action;
