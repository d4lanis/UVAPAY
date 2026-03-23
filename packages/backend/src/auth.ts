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

export async function seedDefaultAdminUser(): Promise<void> {
  try {
    await auth.api.signUpEmail({
      body: {
        name: env.defaultAdminName,
        email: env.defaultAdminEmail,
        password: env.defaultAdminPassword,
      },
    });
    console.info("[auth] default admin user created", { email: env.defaultAdminEmail });
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("already") || message.includes("exists")) {
      return;
    }

    throw error;
  }
}
