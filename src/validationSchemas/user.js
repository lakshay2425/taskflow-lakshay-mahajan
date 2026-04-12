import * as z from "zod";

export const loginSchema = z.object({
    email: z.email()
        .trim(),
    password: z.string()
        .trim()
        .min(6),
});

export const signupSchema = z.object({
    name: z.string().min(6, "Name must be at least 6 characters long"),
    email: z.email().trim(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});
