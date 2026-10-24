import { ApiError } from '@/api';

/** The server's message for API errors, otherwise a caller-supplied fallback. */
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}
