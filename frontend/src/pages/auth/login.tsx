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
import { api } from "@/lib/axios";
import { loginSchema, type LoginData } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Link } from "react-router";

export default function LoginPage() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });
  const navigate = useNavigate();
  const { mutate } = useMutation({
    mutationFn: async (data: LoginData) => {
      return await api.post(`/auth/login`, {
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: () => {
      navigate("/chat", { replace: true });
    },
    onError: () => {
      // TODO: Add toast
    },
  });
  return (
    <div>
      <main className="px-6 ">
        <div className="max-w-md mx-auto">
          <div className="rounded-3xl bg-card w-120 shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p>Sign in to your Instant account</p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
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
            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit((data) => mutate(data))}
              >
                <div>
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
                            className="h-12 rounded-xl border-2"
                            {...field}
                          />
                        </FormControl>
                        {/* <FormMessage/> */}
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
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your Password"
                          />
                        </FormControl>
                        {/* <FormMessage/> */}
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
                      className="h-4 w-4  rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm">
                      Remember me
                    </label>
                  </div>

                  <Link to="#" className="text-sm font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold rounded-xl mt-6"
                >
                  Sign in
                </Button>
              </form>
            </Form>

            {/* Sign up link */}
            <div className="text-center mt-6">
              <p>
                Don't have an account?{" "}
                <Link to="/signup" className="text-primary font-medium">
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
