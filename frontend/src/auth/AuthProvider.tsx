import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, { associationStore, SESSION_EXPIRED_EVENT, tokenStore } from "../lib/api";
import { clearToasts } from "../lib/toast";
import type { Membership, Session, SessionResponse } from "../lib/types";
import { AuthContext } from "./authContext";
import type { AuthValue } from "./authContext";

function pickMembership(session: Session | null | undefined, preferredId: string | null): Membership | null {
  if (!session || session.memberships.length === 0) return null;
  const approved = session.memberships.filter((m) => m.status === "approved");
  return (
    approved.find((m) => String(m.association?.id) === preferredId) ??
    approved[0] ??
    session.memberships[0]
  );
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(() => (tokenStore.get() ? undefined : null));
  const [preferredId, setPreferredId] = useState(() => associationStore.get());

  const refresh = useCallback(async (): Promise<Session | null> => {
    try {
      const { data } = await api.get<Session>("/auth/me");
      setSession(data);
      return data;
    } catch {
      tokenStore.clear();
      setSession(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (tokenStore.get()) {
      api
        .get<Session>("/auth/me")
        .then((r) => setSession(r.data))
        .catch(() => {
          tokenStore.clear();
          setSession(null);
        });
    }

    const onExpired = () => setSession(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const membership = pickMembership(session, preferredId);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      membership,
      applySession: (response) => {
        tokenStore.set(response.token);
        setSession({ user: response.user, memberships: response.memberships });
      },
      updateSession: (next) => setSession({ user: next.user, memberships: next.memberships }),
      login: async (login, password) => {
        const { data } = await api.post<SessionResponse>("/auth/login", { login, password });
        tokenStore.set(data.token);
        setSession({ user: data.user, memberships: data.memberships });
      },
      refresh,
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // Mesmo sem resposta do servidor, a sessão local é encerrada
        }
        tokenStore.clear();
        clearToasts();
        setSession(null);
      },
      switchAssociation: (associationId) => {
        associationStore.set(associationId);
        setPreferredId(String(associationId));
      },
    }),
    [session, membership, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
