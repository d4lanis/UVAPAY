import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";

const ADMIN_EMAILS = ["admin@uvapay.com"];

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

declare module "express-serve-static-core" {
  interface Request {
    authUser?: AuthenticatedUser;
  }
}

function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      res.status(401).json({ message: "No autenticado" });
      return;
    }

    req.authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: isAdminEmail(session.user.email) ? "admin" : "user",
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  if (req.authUser.role !== "admin") {
    res.status(403).json({ message: "No autorizado" });
    return;
  }

  next();
}
