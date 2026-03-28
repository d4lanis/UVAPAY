import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins/bearer";
import { jwt } from "better-auth/plugins/jwt";
import { env } from "./config/env";
import { db } from "./config/drizzle";
import { authSchema } from "./config/schema";

function getSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};

  if (env.googleClientId && env.googleClientSecret) {
    providers.google = {
      clientId: env.googleClientId,
      clientSecret: env.googleClientSecret,
    };
  }

  if (env.githubClientId && env.githubClientSecret) {
    providers.github = {
      clientId: env.githubClientId,
      clientSecret: env.githubClientSecret,
    };
  }

  if (env.microsoftClientId && env.microsoftClientSecret) {
    providers.microsoft = {
      clientId: env.microsoftClientId,
      clientSecret: env.microsoftClientSecret,
    };
  }

  if (env.facebookClientId && env.facebookClientSecret) {
    providers.facebook = {
      clientId: env.facebookClientId,
      clientSecret: env.facebookClientSecret,
    };
  }

  if (env.appleClientId && env.appleClientSecret) {
    providers.apple = {
      clientId: env.appleClientId,
      clientSecret: env.appleClientSecret,
    };
  }

  return providers;
}

export const enabledSocialProviders = Object.keys(getSocialProviders());

export const auth = betterAuth({
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  trustedOrigins: env.trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // In development we expose the reset URL in logs.
      console.info("[auth] reset-password", { email: user.email, url });
    },
  },
  socialProviders: getSocialProviders(),
  plugins: [bearer(), jwt()],
});

/**
 * Seed de usuarios inicial
 * 
 * USUARIOS CREADOS:
 * 1. Admin: admin@uvapay.com / password123$ (rol: admin)
 * 2. Estudiante: estudiante@uvapay.com / password123$ (rol: user/estudiante)
 * 
 * Estos usuarios son recreados si no existen. Si ya existen, se omiten.
 */
const SEED_USERS = [
  {
    email: "admin@uvapay.com",
    password: "password123$",
    name: "Administrador",
    role: "admin" as const,
  },
  {
    email: "estudiante@uvapay.com",
    password: "password123$",
    name: "Estudiante Demo",
    role: "user" as const,
  },
] as const;

async function createUser(email: string, password: string, name: string): Promise<void> {
  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });
}

export async function seedUsers(): Promise<void> {
  for (const seedUser of SEED_USERS) {
    try {
      await createUser(seedUser.email, seedUser.password, seedUser.name);
      console.info("[seed] usuario creado", { email: seedUser.email, role: seedUser.role });
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("already") && !message.includes("exists")) {
        throw error;
      }
      console.info("[seed] usuario ya existe, omitiendo", { email: seedUser.email });
    }
  }
}
