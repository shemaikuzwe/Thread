import { z } from "zod";

const registerSchema = z.object({
  email: z.email({ error: "Invalid Email" }),
  firstName: z.string().min(2, { error: "Invalid firstName" }),
  lastName: z.string().min(2, { error: "Invalid lastName" }),
  password: z.string().min(4, { error: "Please Enter a strong password" }),
  confirmPassword: z.string(),
})

type RegisterData = z.infer<typeof registerSchema>;

const loginSchema = z.object({
  email: z.email({ error: "Invalid Email" }),
  password: z.string().min(4, { error: "Please Enter a strong password" }),
  rememberMe:z.boolean(),
});
type LoginData = z.infer<typeof loginSchema>;

export { registerSchema, type RegisterData, loginSchema, type LoginData };
