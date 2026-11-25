import type { z } from 'zod';

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Returns the first error message for each field, or null when valid. */
export function validate<S extends z.ZodType>(
  schema: S,
  values: unknown,
): { data: z.infer<S>; errors: null } | { data: null; errors: FieldErrors<z.input<S>> } {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: null };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return { data: null, errors: errors as FieldErrors<z.input<S>> };
}
