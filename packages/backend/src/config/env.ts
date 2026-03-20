import dotenv from "dotenv";

dotenv.config();

const required = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "RESEND_API_KEY",
  "UNIVERSITY_FROM_EMAIL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] Missing environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  fromEmail: process.env.UNIVERSITY_FROM_EMAIL || "pagos@universidad.edu",
  betterAuthSecret: process.env.BETTER_AUTH_SECRET || "",
  betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:4000",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  microsoftClientId: process.env.MICROSOFT_CLIENT_ID || "",
  microsoftClientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
  facebookClientId: process.env.FACEBOOK_CLIENT_ID || "",
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
  appleClientId: process.env.APPLE_CLIENT_ID || "",
  appleClientSecret: process.env.APPLE_CLIENT_SECRET || "",
  adminEmails: (process.env.ADMIN_EMAILS || "admin@uva.edu,daniel.alanis.hdz@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "daniel.alanis.hdz@gmail.com",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "Barrera1998.",
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "Daniel Alanis",
};
