import { useEffect, useState } from "react";
import api, { errorMessage } from "./api";

interface State<T> {
  key: string;
  data?: T;
  error?: string;
}

/**
 * Busca dados da API. Mantém o último resultado enquanto recarrega,
 * para a tela não "piscar" ao trocar de aba ou buscar.
 */
export function useApi<T>(path: string | null, params?: Record<string, string | number | undefined>) {
  const [state, setState] = useState<State<T>>({ key: "" });
  const [tick, setTick] = useState(0);
  const paramsKey = JSON.stringify(params ?? {});
  const key = path ? `${path}?${paramsKey}#${tick}` : "";

  useEffect(() => {
    if (!path) return;
    let alive = true;
    const requestKey = `${path}?${paramsKey}#${tick}`;

    api
      .get<T>(path, { params: JSON.parse(paramsKey) })
      .then((r) => alive && setState({ key: requestKey, data: r.data }))
      .catch((e) => alive && setState((s) => ({ key: requestKey, data: s.data, error: errorMessage(e) })));

    return () => {
      alive = false;
    };
  }, [path, paramsKey, tick]);

  return {
    data: state.data,
    error: state.key === key ? state.error : undefined,
    loading: Boolean(path) && state.key !== key,
    reload: () => setTick((t) => t + 1),
  };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
}
