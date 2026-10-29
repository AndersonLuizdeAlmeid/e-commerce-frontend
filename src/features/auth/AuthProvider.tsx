"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "./api";
import { hasSessionHint, refreshSession, type SessionResponse, type SessionUser } from "./session";

type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (request: authApi.RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza a sessão depois de algo que muda o usuário (troca de senha, confirmação de e-mail). */
  applySession: (session: SessionResponse | null) => void;
  markEmailConfirmed: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ status: AuthStatus; user: SessionUser | null }>({ status: "loading", user: null });

  const applySession = useCallback((session: SessionResponse | null) => {
    setState(session ? { status: "authenticated", user: session.user } : { status: "anonymous", user: null });
  }, []);

  // Ao abrir a página: refresh silencioso para restaurar a sessão (arquivo 16 §5), só se já houve login neste navegador.
  useEffect(() => {
    let active = true;
    Promise.resolve(hasSessionHint() ? refreshSession() : null).then((session) => {
      if (active) {
        applySession(session);
      }
    });
    return () => {
      active = false;
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login: async (email, password) => applySession(await authApi.login(email, password)),
      register: async (request) => applySession(await authApi.register(request)),
      logout: async () => {
        await authApi.logout();
        applySession(null);
      },
      applySession,
      markEmailConfirmed: () =>
        setState((current) => (current.user ? { ...current, user: { ...current.user, emailConfirmed: true } } : current)),
    }),
    [state, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa estar dentro do AuthProvider.");
  }
  return context;
}
