import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logError } from "../utils/logger";

type PgLikeError = Error & {
  code?: string;
  constraint?: string;
};

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    logError("Validation error", {
      endpoint: req.path,
      method: req.method,
      statusCode: 400,
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });

    res.status(400).json({
      message: "Datos invalidos",
      errors: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const pgError = err as PgLikeError;
  if (pgError.code === "23505") {
    logError("Database conflict", {
      endpoint: req.path,
      method: req.method,
      statusCode: 409,
      constraint: pgError.constraint,
    });

    res.status(409).json({
      message: "El registro ya existe. Usa una matricula o correo diferente.",
    });
    return;
  }

  logError("Unhandled API error", {
    endpoint: req.path,
    method: req.method,
    statusCode: 500,
    errorName: err.name,
    errorMessage: err.message,
  });

  res.status(500).json({ message: "Error interno del servidor" });
}
