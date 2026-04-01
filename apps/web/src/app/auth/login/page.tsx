"use client";

import { OAuthProviders } from "@/components/auth/providers";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { loginSchema, type LoginData } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });
  const { mutate } = useMutation({
    mutationFn: async (data: LoginData) => {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
        callbackURL: "/chat",
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Login Failed");
    },
  });
  return (
    <div className="flex justify-center items-center w-full min-h-screen">
      <main className="px-6">
        <div className="max-w-md mx-auto">
          <div className="w-100 bg-card shadow-xl p-8 rounded-xl">
            {/* Header */}
            <div className="text-center flex flex-col justify-center items-center mb-8">
              <Logo />
              <h1 className="text-md leading-6 font-bold">Sign in to Thread</h1>
            </div>
            <OAuthProviders />
            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground font-medium">Or</span>
              <Separator className="flex-1" />
            </div>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit((data) => mutate(data))}>
                <div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Enter your Password" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm">
                      Remember me
                    </label>
                  </div>

                  <Link href="#" className="text-sm font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full font-semibold mt-6">
                  Sign in
                </Button>
              </form>
            </Form>

            {/* Sign up link */}
            <div className="text-center mt-6">
              <p>
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-primary font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
