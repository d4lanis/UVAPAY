import { seedDefaultAdminUser } from "../auth";
import { runMigrations } from "../config/db";

async function main(): Promise<void> {
  await runMigrations();
  await seedDefaultAdminUser({ syncPasswordIfExists: true });
  console.info("[seed] admin seeding completed");
}

main().catch((error) => {
  console.error("[seed] admin seeding failed", error);
  process.exit(1);
});
