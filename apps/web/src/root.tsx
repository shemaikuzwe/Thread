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

// export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
//   console.log(error);
//   return (
//     <>
//       <h4>Oops</h4>
//       <p>Something went wrong</p>
//       <button onClick={() => window.location.reload()}>Try Again</button>
//     </>
//   );
// }
export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="favicon" href="/favicon.ico" />
        <title>Thread</title>
        <Links />
      </head>
      <body>
        <Scripts />
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
      </body>
    </html>
  );
}
