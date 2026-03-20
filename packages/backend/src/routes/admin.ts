import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { pool } from "../config/db";

const router = Router();

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

router.get("/payments", async (req, res, next) => {
  try {
    const { limit = 50 } = querySchema.parse(req.query);

    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::int AS created,
        COUNT(*) FILTER (
          WHERE p.status = 'pending'
            AND p.created_at >= NOW() - INTERVAL '30 minutes'
        )::int AS pending,
        COUNT(*) FILTER (
          WHERE p.status = 'pending'
            AND p.created_at < NOW() - INTERVAL '30 minutes'
        )::int AS expired,
        COUNT(*) FILTER (WHERE p.status = 'succeeded')::int AS succeeded,
        COUNT(*) FILTER (WHERE p.status = 'failed')::int AS failed
      FROM payments p
    `);

    const paymentsResult = await pool.query(
      `SELECT
         p.id,
         p.amount,
         p.currency,
         p.status,
         p.created_at AS "createdAt",
         p.paid_at AS "paidAt",
         p.transaction_id AS "transactionId",
         s.full_name AS "studentName",
         s.document_id AS "studentDocumentId",
         c.name AS "conceptName",
         CASE
           WHEN p.status = 'pending' AND p.created_at < NOW() - INTERVAL '30 minutes'
             THEN 'expired'
           ELSE p.status
         END AS "displayStatus"
       FROM payments p
       INNER JOIN students s ON s.id = p.student_id
       INNER JOIN payment_concepts c ON c.id = p.concept_id
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json({
      summary: summaryResult.rows[0],
      payments: paymentsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Obtener lista de estudiantes
router.get("/students", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, document_id AS "documentId", email, full_name AS "fullName"
       FROM students
       ORDER BY full_name`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Obtener conceptos de pago
router.get("/concepts", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, amount, currency
       FROM payment_concepts
       ORDER BY amount DESC`
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Crear pago para estudiante
const createPaymentSchema = z.object({
  studentId: z.string().uuid(),
  conceptId: z.string().min(1),
});

router.post("/payments", async (req, res, next) => {
  try {
    const { studentId, conceptId } = createPaymentSchema.parse(req.body);

    // Verificar que el estudiante existe
    const studentResult = await pool.query(
      `SELECT id, full_name FROM students WHERE id = $1`,
      [studentId]
    );

    if (studentResult.rowCount === 0) {
      return res.status(404).json({ message: "Estudiante no encontrado" });
    }

    // Verificar que el concepto existe
    const conceptResult = await pool.query(
      `SELECT id, name, amount, currency FROM payment_concepts WHERE id = $1`,
      [conceptId]
    );

    if (conceptResult.rowCount === 0) {
      return res.status(404).json({ message: "Concepto de pago no encontrado" });
    }

    const concept = conceptResult.rows[0];
    const paymentId = randomUUID();

    await pool.query(
      `INSERT INTO payments (id, student_id, concept_id, amount, currency, status, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
      [paymentId, studentId, conceptId, concept.amount, concept.currency, randomUUID()]
    );

    res.status(201).json({
      paymentId,
      studentId,
      studentName: studentResult.rows[0].full_name,
      conceptId,
      conceptName: concept.name,
      amount: concept.amount,
      currency: concept.currency,
      status: "pending",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
