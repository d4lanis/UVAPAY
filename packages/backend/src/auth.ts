import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins/bearer";
import { jwt } from "better-auth/plugins/jwt";
import { eq } from "drizzle-orm";
import { env } from "./config/env";
import { db } from "./config/drizzle";
import { authSchema, user } from "./config/schema";

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

async function createDefaultAdminUser(): Promise<void> {
  await auth.api.signUpEmail({
    body: {
      name: env.defaultAdminName,
      email: env.defaultAdminEmail,
      password: env.defaultAdminPassword,
    },
  });
}

async function replaceDefaultAdminUser(): Promise<boolean> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, env.defaultAdminEmail))
    .limit(1);

  if (!existing[0]) {
    return false;
  }

  // Remove the existing default admin user so sign-up rehashes the new password.
  await db.delete(user).where(eq(user.id, existing[0].id));
  await createDefaultAdminUser();
  return true;
}

export async function seedDefaultAdminUser(): Promise<void> {
  try {
    await createDefaultAdminUser();
    console.info("[auth] default admin user created", { email: env.defaultAdminEmail });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("already") || message.includes("exists")) {
      const replaced = await replaceDefaultAdminUser();
      if (replaced) {
        console.info("[auth] default admin user credentials updated", {
          email: env.defaultAdminEmail,
        });
      }
      return;
    }

    throw error;
  }
}
