import axios, { AxiosError } from "axios";

const TOKEN_KEY = "recebeaqui.token";
const ASSOCIATION_KEY = "recebeaqui.association";

// Em produção (Docker) o nginx do front repassa /api para o Laravel.
// Em desenvolvimento o Vite faz o mesmo (veja vite.config.ts).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { Accept: "application/json" },
  timeout: 20000,
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ASSOCIATION_KEY);
  },
};

export const associationStore = {
  get: () => localStorage.getItem(ASSOCIATION_KEY),
  set: (id: number) => localStorage.setItem(ASSOCIATION_KEY, String(id)),
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const associationId = associationStore.get();
  if (associationId) config.headers["X-Association-Id"] = associationId;

  return config;
});

export const SESSION_EXPIRED_EVENT = "recebeaqui:session-expired";

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  },
);

interface LaravelError {
  message?: string;
  errors?: Record<string, string[]>;
}

/** Erros de validação por campo: { phone: "Este telefone..." } */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {};
  const errors = (error.response?.data as LaravelError | undefined)?.errors ?? {};
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]));
}

/** Mensagem única, pronta para mostrar na tela. */
export function errorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "Algo deu errado. Tente de novo.";
  if (!error.response) return "Sem conexão com o servidor. Confira sua internet e tente de novo.";

  const data = error.response.data as LaravelError | undefined;
  const first = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
  if (first) return first;
  if (error.response.status === 429) return "Muitas tentativas. Espere um minuto e tente de novo.";
  if (error.response.status >= 500) return "O servidor teve um problema. Tente de novo em instantes.";
  return data?.message || "Algo deu errado. Tente de novo.";
}

export default api;
