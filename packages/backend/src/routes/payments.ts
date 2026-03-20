import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { pool } from "../config/db";
import { requireAuth } from "../middleware/auth";
import { paymentRateLimiter } from "../middleware/rateLimit";
import { sendPaymentConfirmationEmail } from "../services/emailService";
import { generateReceiptPdf } from "../services/receiptService";
import { createPaymentIntent } from "../services/stripeService";

const router = Router();

router.get("/my-payments", requireAuth, async (req, res, next) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const studentResult = await pool.query(
      `SELECT id FROM students WHERE email = $1`,
      [req.authUser.email]
    );

    if (studentResult.rowCount === 0) {
      return res.status(404).json({ message: "Perfil de estudiante no encontrado" });
    }

    const studentId = (studentResult.rows[0] as { id: string }).id;

    const result = await pool.query(
      `SELECT p.id, p.amount, p.currency, p.status, p.transaction_id, p.paid_at, p.created_at,
              c.name AS concept_name
       FROM payments p
       INNER JOIN payment_concepts c ON c.id = p.concept_id
       WHERE p.student_id = $1
       ORDER BY p.created_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

const createPaymentSchema = z.object({
  conceptId: z.string().min(1),
  idempotencyKey: z.uuid(),
});

const processPaymentSchema = z.object({
  paymentIntentId: z.string().min(1),
});

router.post("/", paymentRateLimiter, async (req, res, next) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const parsed = createPaymentSchema.parse(req.body);

    const studentResult = await pool.query(
      `SELECT id FROM students WHERE email = $1`,
      [req.authUser.email]
    );

    if (studentResult.rowCount === 0) {
      return res.status(404).json({ message: "Perfil de estudiante no encontrado" });
    }

    const studentId = (studentResult.rows[0] as { id: string }).id;

    const conceptResult = await pool.query(
      "SELECT id, name, amount, currency FROM payment_concepts WHERE id = $1",
      [parsed.conceptId]
    );

    if (conceptResult.rowCount === 0) {
      return res.status(404).json({ message: "Concepto no encontrado" });
    }

    const concept = conceptResult.rows[0] as {
      id: string;
      name: string;
      amount: number;
      currency: string;
    };

    const paymentId = randomUUID();
    const paymentIntent = await createPaymentIntent({
      amount: concept.amount,
      currency: concept.currency,
      idempotencyKey: parsed.idempotencyKey,
      metadata: {
        paymentId,
        studentId,
        conceptId: parsed.conceptId,
      },
    });

    await pool.query(
      `INSERT INTO payments (id, student_id, concept_id, amount, currency, status, stripe_payment_intent_id, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        paymentId,
        studentId,
        parsed.conceptId,
        concept.amount,
        concept.currency,
        "pending",
        paymentIntent.id,
        parsed.idempotencyKey,
      ]
    );

    res.status(201).json({
      paymentId,
      clientSecret: paymentIntent.client_secret,
      amount: concept.amount,
      currency: concept.currency,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:paymentId/process", paymentRateLimiter, async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const parsed = processPaymentSchema.parse(req.body);

    const paymentIntentResult = await pool.query(
      `SELECT p.id, p.amount, p.currency, p.stripe_payment_intent_id,
              s.email, s.full_name, c.name AS concept_name
       FROM payments p
       INNER JOIN students s ON s.id = p.student_id
       INNER JOIN payment_concepts c ON c.id = p.concept_id
       WHERE p.id = $1`,
      [paymentId]
    );

    if (paymentIntentResult.rowCount === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const payment = paymentIntentResult.rows[0];
    const succeeded = parsed.paymentIntentId.length > 5;
    const status = succeeded ? "succeeded" : "failed";
    const transactionId = succeeded ? parsed.paymentIntentId : null;

    await pool.query(
      `UPDATE payments
       SET status = $2,
           transaction_id = $3,
           paid_at = CASE WHEN $2 = 'succeeded' THEN NOW() ELSE NULL END
       WHERE id = $1`,
      [paymentId, status, transactionId]
    );

    if (succeeded && transactionId) {
      await sendPaymentConfirmationEmail({
        to: payment.email,
        studentName: payment.full_name,
        conceptName: payment.concept_name,
        amount: payment.amount,
        currency: payment.currency,
        transactionId,
      });
    }

    res.json({ paymentId, status, transactionId });
  } catch (error) {
    next(error);
  }
});

router.get("/:paymentId/receipt", async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.amount, p.currency, p.transaction_id, p.paid_at,
              s.full_name, s.email, c.name AS concept_name
       FROM payments p
       INNER JOIN students s ON s.id = p.student_id
       INNER JOIN payment_concepts c ON c.id = p.concept_id
       WHERE p.id = $1 AND p.status = 'succeeded'`,
      [paymentId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Comprobante no disponible" });
    }

    const row = result.rows[0];
    const pdf = await generateReceiptPdf({
      paymentId: row.id,
      studentName: row.full_name,
      studentEmail: row.email,
      conceptName: row.concept_name,
      amount: row.amount,
      currency: row.currency,
      transactionId: row.transaction_id,
      paidAt: row.paid_at,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=recibo-${paymentId}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

// Simular pago (sin usar Stripe)
router.post("/:paymentId/simulate", requireAuth, async (req, res, next) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const { paymentId } = req.params;

    // Verificar que el pago pertenece al estudiante
    const studentResult = await pool.query(
      `SELECT s.id, s.email, s.full_name FROM students s
       INNER JOIN payments p ON p.student_id = s.id
       WHERE p.id = $1 AND s.email = $2`,
      [paymentId, req.authUser.email]
    );

    if (studentResult.rowCount === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const student = studentResult.rows[0];
    const transactionId = `SIM-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Actualizar el pago como exitoso
    await pool.query(
      `UPDATE payments
       SET status = 'succeeded',
           transaction_id = $2,
           paid_at = NOW()
       WHERE id = $1`,
      [paymentId, transactionId]
    );

    // Obtener detalles del pago para el correo
    const paymentResult = await pool.query(
      `SELECT p.amount, p.currency, c.name AS concept_name
       FROM payments p
       INNER JOIN payment_concepts c ON c.id = p.concept_id
       WHERE p.id = $1`,
      [paymentId]
    );

    const payment = paymentResult.rows[0];

    // Enviar correo de confirmación
    await sendPaymentConfirmationEmail({
      to: student.email,
      studentName: student.full_name,
      conceptName: payment.concept_name,
      amount: payment.amount,
      currency: payment.currency,
      transactionId,
    });

    res.json({ paymentId, status: "succeeded", transactionId });
  } catch (error) {
    next(error);
  }
});

export default router;
