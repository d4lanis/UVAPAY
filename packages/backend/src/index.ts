import cors from "cors";
import express from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import { auth, enabledSocialProviders, seedDefaultAdminUser } from "./auth";
import { pool, runMigrations } from "./config/db";
import { env } from "./config/env";
import { requireAdmin, requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import adminRouter from "./routes/admin";
import paymentConceptsRouter from "./routes/paymentConcepts";
import paymentsRouter from "./routes/payments";
import studentsRouter from "./routes/students";
import webhooksRouter from "./routes/webhooks";
import { logInfo } from "./utils/logger";

async function bootstrap(): Promise<void> {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.frontendUrl, credentials: true }));

  app.get("/api/auth/providers", (_req, res) => {
    res.json({ providers: enabledSocialProviders });
  });

  // Endpoint para obtener el usuario actual con su rol
  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({
      user: req.authUser,
      isAdmin: req.authUser?.role === "admin",
    });
  });

  app.all("/api/auth/*splat", toNodeHandler(auth));
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", db: "connected" });
    } catch {
      res.status(500).json({ status: "error", db: "disconnected" });
    }
  });

  app.use("/api/students", studentsRouter);
  app.use("/api/payment-concepts", requireAuth, paymentConceptsRouter);
  app.use("/api/payments", requireAuth, paymentsRouter);
  app.use("/api/admin", requireAuth, requireAdmin, adminRouter);
  app.use("/api/webhooks", webhooksRouter);
  app.use(errorHandler);

  if (env.databaseUrl) {
    await runMigrations();
  }

  await seedDefaultAdminUser();

  app.listen(env.port, () => {
    logInfo("Backend started", { port: env.port, env: env.nodeEnv });
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
