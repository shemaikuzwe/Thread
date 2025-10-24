import { Toaster as Sonner, Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "./components/providers/session-provider";
import { Links, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./index.css";
import type { Route } from "./+types/root";
import { authMiddleware, userContext } from "./middleware";
import { ThemeProvider } from "./components/theme-provider";
import { commitSession, getSession } from "./sessions.server";
import type { Theme } from "./lib/types";

const queryClient = new QueryClient();

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = context.get(userContext);
  const cookie = await getSession(request.headers.get("cookie"));
  return { session, theme: cookie.get("theme") };
}
export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function action({ request }: Route.ActionArgs) {
  //TODO:validate body
  const formData = await request.formData();
  console.log("received req");
  console.log("formData", formData);
  const theme = formData.get("theme");
  if (!theme) return;
  const cookie = await getSession(request.headers.get("Cookie"));
  cookie.set("theme", theme as string);
  commitSession(cookie);
}
export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <title>Instant</title>
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            defaultTheme="system"
            cookieTheme={loaderData.theme as Theme}
          >
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <SessionProvider session={loaderData.session}>
                <Outlet />
              </SessionProvider>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
