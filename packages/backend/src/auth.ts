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

function buildAdminNameFromEmail(email: string): string {
  const localPart = email.split("@")[0] || "admin";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function createAdminUser(email: string, password: string): Promise<void> {
  await auth.api.signUpEmail({
    body: {
      name: buildAdminNameFromEmail(email),
      email,
      password,
    },
  });
}

async function replaceAdminUser(email: string, password: string): Promise<boolean> {
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!existing[0]) {
    return false;
  }

  // Remove the existing admin user so sign-up rehashes the new password.
  await db.delete(user).where(eq(user.id, existing[0].id));
  await createAdminUser(email, password);
  return true;
}

type SeedAdminUsersOptions = {
  syncPasswordIfExists?: boolean;
};

export async function seedAdminUsers(options: SeedAdminUsersOptions = {}): Promise<void> {
  const { syncPasswordIfExists = false } = options;
  const password = env.adminSeedPassword;

  for (const email of env.adminEmails) {
    try {
      await createAdminUser(email, password);
      console.info("[auth] admin user created", { email });
      continue;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      if (!message.includes("already") && !message.includes("exists")) {
        throw error;
      }

      if (!syncPasswordIfExists) {
        continue;
      }

      const replaced = await replaceAdminUser(email, password);
      if (replaced) {
        console.info("[auth] admin user credentials updated", { email });
      }
    }
  }
}
