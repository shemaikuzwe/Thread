import { createRouteHandler, createUploadthing } from "uploadthing/remix";
import { UploadThingError } from "uploadthing/server";
import type { FileRouter } from "uploadthing/types";
import { api } from "../lib/axios";
import type { Session } from "../lib/types";

const f = createUploadthing();

export const uploadRouter = {
  videoAndImage: f({
    image: { maxFileSize: "4MB" },
    video: { maxFileSize: "16MB" },
  })
    .middleware(async ({ event }) => {
      const res = await api.get("/auth/session", {
        headers: {
          Cookie: event.headers.get("Cookie") || "",
        },
      });
      if (!res.data) {
        throw new Error("Something went wrong");
      }
      const session = res.data as Session;
      if (session.status === "authenticated" || !session.user) {
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

export const { loader, action } = createRouteHandler({ router: uploadRouter });
