import { z } from 'zod';

/** Mirrors the Supabase Auth password policy in supabase/config.jsonc. */
export const PASSWORD_MIN_LENGTH = 10;

const email = z
  .string()
  .trim()
  .min(1, { error: 'Enter your email address.' })
  .pipe(z.email({ error: 'Enter a valid email address, like name@example.com.' }));

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, {
    error: `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  })
  .max(72, { error: 'Use 72 characters or fewer.' })
  .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), {
    error: 'Include at least one letter and one number.',
  });

export const registrationSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Enter the name you would like to use.' })
    .max(80, { error: 'Use 80 characters or fewer.' }),
  email,
  password: newPassword,
  ageConfirmed: z.literal(true, {
    error: 'You must be 18 or older to create an account.',
  }),
  policiesAccepted: z.literal(true, {
    error: 'You must accept the terms of use and privacy notice to create an account.',
  }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Enter your password.' }),
});

export const emailOnlySchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    error: 'The passwords do not match.',
    path: ['confirmPassword'],
  });

/**
 * Only allow redirects to same-site paths (prevents open redirects via ?next=).
 */
export function safeNextPath(next: string | null | undefined, fallback = '/account'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return fallback;
  }
  return next;
}
