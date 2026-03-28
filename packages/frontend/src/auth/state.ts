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
  role: "admin" | "user";
  loginWithEmail: (email: string, password: string) => Promise<"admin" | "user">;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signInWithProvider: (provider: string, callbackURL?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<"admin" | "user">;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
