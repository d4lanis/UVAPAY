import { seedUsers } from "../auth";
import { runMigrations } from "../config/db";

async function main(): Promise<void> {
  await runMigrations();
  await seedUsers();
  console.info("[seed] seeding completado");
}

main().catch((error) => {
  console.error("[seed] seeding fallido", error);
  process.exit(1);
});
