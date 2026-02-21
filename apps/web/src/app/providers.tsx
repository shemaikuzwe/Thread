"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/sonner"; // Assuming double toaster was intentional in root.tsx
import { SessionProvider } from "@/components/providers/session-provider";
import { useState } from "react";
import type { Session } from "@/lib/types";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SessionProvider session={session}>{children}</SessionProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
