import { Toaster as Sonner, Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "./components/providers/session-provider";
import { Links, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./index.css";
import type { Route } from "./+types/root";
import { authMiddleware, userContext } from "./middleware";
import { ThemeProvider } from "next-themes";

const queryClient = new QueryClient();

export async function loader({ context }: Route.LoaderArgs) {
  const session = context.get(userContext);
  return { session };
}
export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

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
          <ThemeProvider attribute={"class"} defaultTheme="system">
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
