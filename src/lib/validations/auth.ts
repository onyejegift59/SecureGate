import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const emailField = z
  .string({ required_error: "Please enter your email" })
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .min(1, "Please enter your email")
      .email("Please enter a valid email address")
  );

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Please enter your password"),
});

export const registerSchema = z
  .object({
    name: z.string().max(100).optional(),
    email: emailField,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({
  email: emailField,
});

export const verifyEmailSchema = z.object({
  email: emailField,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
