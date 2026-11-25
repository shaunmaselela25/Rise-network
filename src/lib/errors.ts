import { useAsync } from './useAsync';

/** Error whose message is safe to show to users. All other errors get a generic message. */
export class UserFacingError extends Error {}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof UserFacingError ? error.message : fallback;
}

/**
 * Converts a Supabase/PostgREST error into a UserFacingError. Raw database messages are
 * logged for developers and never shown, except messages raised deliberately by RISE NETWORK
 * database functions (rule violations 22023 and rate limits 54000), which are written for users.
 */
export function toUserFacing(
  error: { code?: string; message?: string },
  fallback: string,
): UserFacingError {
  console.error(error);
  if ((error.code === '54000' || error.code === '22023') && error.message) {
    return new UserFacingError(error.message);
  }
  return new UserFacingError(fallback);
}

/** useAsync with the safe error-message policy. */
export function useData<T>(load: () => Promise<T>, key: string) {
  return useAsync(load, key, (error) => errorMessage(error));
}
