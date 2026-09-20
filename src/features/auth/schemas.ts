import { z } from 'zod';

// Messages are i18n keys: the form layer translates them, so schemas stay language-free.
const email = z
  .string()
  .trim()
  .min(1, { error: 'validation.required' })
  .pipe(z.email({ error: 'validation.email' }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'validation.required' }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'validation.required' })
    .max(100, { error: 'validation.nameMax' }),
  email,
  password: z
    .string()
    .min(10, { error: 'validation.passwordMin' })
    .max(128, { error: 'validation.passwordMax' }),
  registrationCode: z.string().trim().min(1, { error: 'validation.required' }),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
