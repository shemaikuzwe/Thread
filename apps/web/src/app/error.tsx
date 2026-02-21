"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileQuestion, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-lg mx-auto rounded-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold text-primary mb-2">Errors</CardTitle>
          <CardDescription className="text-2xl font-semibold">Oopps!</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <FileQuestion size={100} className="text-muted-foreground" />
          <p className="text-center text-muted-foreground">Something went wrong</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button onClick={() => reset()}>
            <RefreshCcw className="w-5 h-5 mr-2" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
