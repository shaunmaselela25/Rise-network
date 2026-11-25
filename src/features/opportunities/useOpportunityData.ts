import { useAsync } from '../../lib/useAsync';
import { UserFacingError } from './api';

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return error instanceof UserFacingError ? error.message : fallback;
}

/** useAsync with RISE NETWORK's safe error-message policy. */
export function useOpportunityData<T>(load: () => Promise<T>, key: string) {
  return useAsync(load, key, (error) => errorMessage(error));
}
