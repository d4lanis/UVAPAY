import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { pool } from "../config/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

const studentSchema = z.object({
  documentId: z.string().min(5),
  email: z.email(),
  fullName: z.string().min(3),
  phone: z.string().min(7),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = studentSchema.parse(req.body);
    const studentId = randomUUID();

    const result = await pool.query(
      `INSERT INTO students (id, document_id, email, full_name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, document_id AS "documentId", email, full_name AS "fullName", phone, created_at AS "createdAt"`,
      [studentId, parsed.documentId, parsed.email, parsed.fullName, parsed.phone]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const result = await pool.query(
      `SELECT id, document_id AS "documentId", email, full_name AS "fullName", phone
       FROM students
       WHERE email = $1`,
      [req.authUser.email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Perfil de estudiante no encontrado" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return next(error);
  }
});

export default router;
