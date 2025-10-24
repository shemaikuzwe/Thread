import Github from "@/components/auth/github";
import Google from "@/components/auth/google";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterData } from "@/lib/schema";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/axios";
export default function RegisterPage() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
  });
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
    onSuccess: () => {},
    onError: () => {
      // TODO: Add toast
    },
  });
  return (
    <div>
      <main className="px-6 py-2">
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-xl w-120 h-165 shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold  mb-2">Welcome to Instant</h1>
              <p>Create your account to continue</p>
            </div>

            {/* OAuth Buttons */}
            <div className="flex flex-col gap-2">
              <Google />
              <Github />
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((data) => mutate(data))}
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="h-12 w-full rounded-xl border-2"
                          {...field}
                        />
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
                          <Input
                            {...field}
                            placeholder="Enter your FirstName"
                          />
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
                          <Input
                            {...field}
                            placeholder="Enter your FirstName"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex  gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your Password"
                          />
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
                          <Input
                            {...field}
                            type="password"
                            placeholder="ConfirmPassword"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 font-semibold rounded-xl mt-6"
                >
                  Sign Up
                </Button>
              </form>
            </Form>

            {/* Sign up link */}
            <div className="text-center mt-6">
              <p>
                Have an account?{" "}
                <Link to="/login" className="text-primary font-medium">
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
