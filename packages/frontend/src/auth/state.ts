import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signInWithProvider: (provider: string, callbackURL?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Fallback local (el backend es la fuente de verdad para el rol de admin)
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "admin@uva.edu,daniel.alanis.hdz@gmail.com")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
