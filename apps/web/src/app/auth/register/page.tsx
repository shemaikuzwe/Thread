"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterData } from "@/lib/schema";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { Separator } from "@/components/ui/separator";
import { OAuthProviders } from "@/components/auth/providers";
import Logo from "@/components/logo";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
  });
  const router = useRouter();
  const { mutate } = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await api.post(
        `/auth/signup`,
        {
          email: data.email,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!res.status.toString().startsWith("2")) {
        const error = await res.data;
        throw new Error(error.message || "something went wrong");
      }
      return await res.data;
    },
    onSuccess: () => {
      router.push("/chat");
    },
    onError: () => {
      // TODO: Add toast
    },
  });
  return (
    <div className="flex justify-center items-center min-h-screen">
      <main className="px-6 py-2">
        <div className="max-w-md mx-auto">
          <div className="bg-card w-105 shadow-xl rounded-xl p-6">
            {/* Header */}
            <div className="flex flex-col justify-center items-center text-center mb-8">
              <Logo />
              <h1 className="text-md leading-6 font-bold">Sign up to Thread</h1>
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

                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>FirstName</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your First Name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LastName</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter your Last Name" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ConfirmPassword</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Confirm password" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full font-semibold mt-6">
                  Sign Up
                </Button>
              </form>
            </Form>

            {/* Login link */}
            <div className="text-center mt-3">
              <p>
                Have an account?{" "}
                <Link href="/auth/login" className="text-primary font-medium">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
