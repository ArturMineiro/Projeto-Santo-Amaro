import { createContext, useContext } from "react";
import type { Membership, Session, SessionResponse } from "../lib/types";

export interface AuthValue {
  /** undefined = carregando; null = sem sessão */
  session: Session | null | undefined;
  /** Vínculo em uso (associação atual) */
  membership: Membership | null;
  login: (login: string, password: string) => Promise<void>;
  applySession: (response: SessionResponse) => void;
  updateSession: (session: Session) => void;
  refresh: () => Promise<Session | null>;
  logout: () => Promise<void>;
  switchAssociation: (associationId: number) => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return value;
}
