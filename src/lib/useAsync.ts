import { useCallback, useEffect, useState } from 'react';

export type AsyncState<T> =
  { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: T };

/**
 * Runs `load` whenever `key` changes and exposes loading / error / ready states.
 * Results from superseded requests are ignored. Error messages come only from errors
 * that are explicitly marked safe to show (see `safeMessage`).
 */
export function useAsync<T>(
  load: () => Promise<T>,
  key: string,
  safeMessage: (error: unknown) => string,
): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [version, setVersion] = useState(0);
  // Reset to loading when the inputs change (render-phase update, no effect needed).
  const [lastKey, setLastKey] = useState(`${key}#${version}`);
  if (lastKey !== `${key}#${version}`) {
    setLastKey(`${key}#${version}`);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (active) setState({ status: 'error', message: safeMessage(error) });
      },
    );
    return () => {
      active = false;
    };
    // `load` and `safeMessage` are intentionally keyed by `key`/`version`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
