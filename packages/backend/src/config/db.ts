import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({ connectionString: env.databaseUrl || undefined });

export async function runMigrations(): Promise<void> {
  if (!env.databaseUrl) {
    return;
  }

  // Tablas de better-auth
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMPTZ,
      refresh_token_expires_at TIMESTAMPTZ,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "jwks" (
      id TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ
    );
  `);

  // Tablas de la aplicación
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY,
      document_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payment_concepts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY,
      student_id UUID NOT NULL REFERENCES students(id),
      concept_id TEXT NOT NULL REFERENCES payment_concepts(id),
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      stripe_payment_intent_id TEXT,
      transaction_id TEXT,
      idempotency_key TEXT UNIQUE,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(
    `INSERT INTO payment_concepts (id, name, amount, currency)
     VALUES
      ('colegiatura-reinscripcion', 'Colegiatura + Reinscripcion', 540000, 'MXN'),
      ('libros-ingles', 'Libros de ingles', 80000, 'MXN'),
      ('casilleros', 'Casilleros', 25000, 'MXN'),
      ('constancias', 'Constancias', 10000, 'MXN'),
      ('transporte', 'Pago transporte', 10000, 'MXN'),
      ('credenciales', 'Credenciales', 10000, 'MXN')
       ON CONFLICT (id) DO UPDATE
       SET
        name = EXCLUDED.name,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency`
  );

  // Normalizar moneda a MXN para evitar datos legacy en COP.
  await pool.query(`UPDATE payment_concepts SET currency = 'MXN' WHERE currency <> 'MXN'`);
  await pool.query(`UPDATE payments SET currency = 'MXN' WHERE currency <> 'MXN'`);

  // Deduplicar conceptos repetidos por nombre/monto/moneda.
  // Si un pago apunta al duplicado, se reasigna al concepto canónico.
  await pool.query(`
    WITH ranked AS (
      SELECT
        id,
        name,
        amount,
        currency,
        FIRST_VALUE(id) OVER (
          PARTITION BY name, amount, currency
          ORDER BY id
        ) AS canonical_id,
        ROW_NUMBER() OVER (
          PARTITION BY name, amount, currency
          ORDER BY id
        ) AS rn
      FROM payment_concepts
    ),
    duplicates AS (
      SELECT id AS duplicate_id, canonical_id
      FROM ranked
      WHERE rn > 1
    ),
    remapped AS (
      UPDATE payments p
      SET concept_id = d.canonical_id
      FROM duplicates d
      WHERE p.concept_id = d.duplicate_id
      RETURNING p.id
    )
    DELETE FROM payment_concepts pc
    USING duplicates d
    WHERE pc.id = d.duplicate_id
  `);

  await pool.query(
    `INSERT INTO students (id, document_id, email, full_name, phone)
     VALUES
      ('11111111-1111-4111-8111-111111111111', '1001001001', 'daniel.alanis@uva.edu', 'Daniel Alanis', '3001112233'),
      ('22222222-2222-4222-8222-222222222222', '1001001002', 'maria.lopez@uva.edu', 'Maria Lopez', '3002223344'),
      ('33333333-3333-4333-8333-333333333333', '1001001003', 'carlos.perez@uva.edu', 'Carlos Perez', '3003334455'),
      ('44444444-4444-4444-8444-444444444444', '1001001004', 'laura.gomez@uva.edu', 'Laura Gomez', '3004445566')
     ON CONFLICT (document_id) DO NOTHING`
  );

  const paymentsCount = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM payments");
  const shouldSeedPayments = Number(paymentsCount.rows[0]?.count ?? 0) === 0;

  if (shouldSeedPayments) {
    const paymentConcepts = [
      { id: "colegiatura-reinscripcion", amount: 540000 },
      { id: "libros-ingles", amount: 80000 },
      { id: "casilleros", amount: 25000 },
      { id: "constancias", amount: 10000 },
      { id: "transporte", amount: 10000 },
      { id: "credenciales", amount: 10000 },
    ];

    const studentIds = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
      "44444444-4444-4444-8444-444444444444",
    ];

    const statuses = ["succeeded", "pending", "failed", "expired"];
    const intervals = [
      "2 days",
      "1 day",
      "12 hours",
      "6 hours",
      "3 hours",
      "1 hour",
      "30 minutes",
      "10 minutes",
    ];

    const payments: string[] = [];
    for (let i = 0; i < 20; i++) {
      const concept = paymentConcepts[i % paymentConcepts.length];
      const studentId = studentIds[i % studentIds.length];
      const status = statuses[i % statuses.length];
      const interval = intervals[i % intervals.length];
      const hasPaidAt = status === "succeeded";
      const hasTxnId = status === "succeeded";
      const uuid = `0000${String(i + 1).padStart(4, "0")}-0000-4000-8000-000000000000`.slice(0, 36);

      payments.push(
        `(
          '${uuid}',
          '${studentId}',
          '${concept.id}',
          ${concept.amount},
          'MXN',
          '${status}',
          'pi_seed_${String(i + 1).padStart(3, "0")}',
          ${hasTxnId ? `'txn_seed_${String(i + 1).padStart(3, "0")}'` : "NULL"},
          'seed-key-${String(i + 1).padStart(3, "0")}',
          ${hasPaidAt ? `NOW() - INTERVAL '${interval}'` : "NULL"},
          NOW() - INTERVAL '${interval}'
        )`
      );
    }

    await pool.query(
      `INSERT INTO payments (
        id,
        student_id,
        concept_id,
        amount,
        currency,
        status,
        stripe_payment_intent_id,
        transaction_id,
        idempotency_key,
        paid_at,
        created_at
      ) VALUES ${payments.join(",")}
       ON CONFLICT (id) DO NOTHING`
    );
  }
}
