import { z } from 'zod';

export const addMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: 'validation.required' })
    .pipe(z.email({ error: 'validation.email' })),
  role: z.string().min(1, { error: 'validation.required' }),
});

export type AddMemberForm = z.infer<typeof addMemberSchema>;
