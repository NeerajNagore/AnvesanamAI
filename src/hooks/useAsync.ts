import { useCallback, useEffect, useState } from "react";
import { isAbort } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Runs an async function whenever `deps` change, with loading/error state, cancellation and manual reload. */
export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));
    fn(ctrl.signal)
      .then((data) => {
        if (!ctrl.signal.aborted) setState({ data, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted || isAbort(e)) return;
        setState((s) => ({ ...s, loading: false, error: errorMessage(e) }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((data: T | null) => setState((s) => ({ ...s, data })), []);
  return { ...state, reload, setData };
}

export function useDebounce<T>(value: T, delay = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
