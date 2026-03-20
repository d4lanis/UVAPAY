import { Router } from "express";
import { pool } from "../config/db";

const router = Router();

router.get("/", async (_req, res, next) => {
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

export default router;
