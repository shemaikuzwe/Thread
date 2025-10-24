import { createCookieSessionStorage } from "react-router";

type SessionData = {
  theme: string;
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
      maxAge: Infinity,
      path: "/",
      sameSite: "lax",
      secrets: ["s3cret1"],
      secure: import.meta.env.PROD,
    },
  });

export { getSession, commitSession, destroySession };
