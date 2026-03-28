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
  const [role, setRole] = useState<"admin" | "user">("user");
  const [loading, setLoading] = useState(true);

  const refreshSession = async (): Promise<"admin" | "user"> => {
    let currentRole: "admin" | "user" = "user";
    try {
      const session = await authClient.getSession();
      const sessionUser = session.data?.user;
      if (!sessionUser) {
        setUser(null);
        setRole("user");
        return "user";
      }

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
        currentRole = data.user.role;
        setRole(data.user.role);
      } else {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
        });
        setRole("user");
      }
    } catch {
      setUser(null);
      setRole("user");
    }
    return currentRole;
  };

  useEffect(() => {
    refreshSession()
      .catch(() => {
        setUser(null);
        setRole("user");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setRole("user");
    };

    window.addEventListener("session:expired", handleSessionExpired);
    return () => window.removeEventListener("session:expired", handleSessionExpired);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,
      isAdmin: role === "admin",
      role,
      loginWithEmail: async (email, password) => {
        const result = await authClient.signIn.email({ email, password, rememberMe: true });
        if (result.error) {
          throw new Error(result.error.message || "No fue posible iniciar sesion");
        }

        return refreshSession();
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
        setRole("user");
      },
      refreshSession,
    };
  }, [loading, user, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
