import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { API_URL } from "../api/baseUrl";
import { authClient } from "./client";
import { AuthContext, type AuthContextValue, type AuthUser } from "./state";

function normalizeError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(fallback);
}

interface AuthMeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user";
  };
  isAdmin: boolean;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const session = await authClient.getSession();
      const sessionUser = session.data?.user;
      if (!sessionUser) {
        setUser(null);
        setIsAdmin(false);
        return;
      }

      // Obtener el rol del usuario desde el backend
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const data: AuthMeResponse = await response.json();
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
            isAdmin: data.isAdmin,
          });
          setIsAdmin(data.isAdmin);
        } else {
          // Fallback: usar la sesión sin información de admin
          setUser({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.name,
          });
          setIsAdmin(false);
        }
      } catch {
        // Si falla la llamada al endpoint, usar sesión básica
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
        });
        setIsAdmin(false);
      }
    } catch {
      setUser(null);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    refreshSession()
      .catch(() => {
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => setLoading(false));
  }, []);

  // Escuchar evento de sesión expirada (solo limpia estado, la navegación se maneja en los componentes)
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAdmin(false);
    };

    window.addEventListener("session:expired", handleSessionExpired);
    return () => window.removeEventListener("session:expired", handleSessionExpired);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,
      isAdmin,
      loginWithEmail: async (email, password) => {
        const result = await authClient.signIn.email({ email, password, rememberMe: true });
        if (result.error) {
          throw new Error(result.error.message || "No fue posible iniciar sesion");
        }

        await refreshSession();
      },
      registerWithEmail: async (name, email, password) => {
        const result = await authClient.signUp.email({ name, email, password });
        if (result.error) {
          throw new Error(result.error.message || "No fue posible crear la cuenta");
        }

        await refreshSession();
      },
      requestPasswordReset: async (email) => {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: `${window.location.origin}/login`,
        });

        if (result.error) {
          throw normalizeError(result.error, "No fue posible enviar el enlace de recuperacion");
        }
      },
      signInWithProvider: async (provider, callbackURL = `${window.location.origin}/estudiante/pagos`) => {
        const fn = authClient.signIn.social as (args: {
          provider: string;
          callbackURL: string;
        }) => Promise<{ error?: { message?: string } | null }>;

        const result = await fn({ provider, callbackURL });
        if (result.error) {
          throw new Error(result.error.message || "No fue posible iniciar sesion social");
        }
      },
      logout: async () => {
        await authClient.signOut();
        setUser(null);
        setIsAdmin(false);
      },
      refreshSession,
    };
  }, [loading, user, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
