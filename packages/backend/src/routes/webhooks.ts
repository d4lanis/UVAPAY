import { Router } from "express";

const router = Router();

router.post("/stripe", (_req, res) => {
  // En la siguiente iteracion se valida firma y se procesan eventos reales.
  res.status(202).json({ received: true });
});

export default router;
