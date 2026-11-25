import type { Session } from '@supabase/supabase-js';
import { vi } from 'vitest';

type Result = { data: unknown; error: unknown; count?: number | null };
type Call = { method: string; args: unknown[] };

/**
 * Chainable, thenable stand-in for the supabase-js query builder.
 * Every call is recorded per table so tests can assert on the query that was built.
 */
export function createQueryClient(options: {
  session?: Session | null;
  tables?: Record<string, Result | (() => Result)>;
  rpc?: (name: string, args: unknown) => Result;
}) {
  const calls: Record<string, Call[]> = {};
  const resolveTable = (table: string): Result => {
    const entry = options.tables?.[table];
    if (!entry) return { data: [], error: null, count: 0 };
    return typeof entry === 'function' ? entry() : entry;
  };

  function builder(table: string) {
    const log = (calls[table] ??= []);
    let single = false;
    const chain: Record<string, unknown> = {};
    for (const method of [
      'select',
      'insert',
      'update',
      'delete',
      'eq',
      'neq',
      'or',
      'in',
      'gte',
      'lte',
      'order',
      'range',
      'limit',
      'textSearch',
      'ilike',
    ]) {
      chain[method] = (...args: unknown[]) => {
        log.push({ method, args });
        return chain;
      };
    }
    chain.single = chain.maybeSingle = (...args: unknown[]) => {
      log.push({ method: 'single', args });
      single = true;
      return chain;
    };
    chain.then = (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) => {
      try {
        const result = resolveTable(table);
        const data = single && Array.isArray(result.data) ? (result.data[0] ?? null) : result.data;
        return Promise.resolve({ ...result, data }).then(resolve, reject);
      } catch (error) {
        return Promise.reject(error).then(resolve, reject);
      }
    };
    return chain;
  }

  const client = {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: options.session ?? null } })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn((table: string) => builder(table)),
    rpc: vi.fn((name: string, args: unknown) =>
      Promise.resolve(options.rpc ? options.rpc(name, args) : { data: null, error: null }),
    ),
    calls,
    /** Calls of `method` made on `table`. */
    callsTo(table: string, method: string) {
      return (calls[table] ?? []).filter((c) => c.method === method).map((c) => c.args);
    },
  };
  return client;
}
