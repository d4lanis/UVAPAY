import rateLimit from "express-rate-limit";

export const paymentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiados intentos. Intenta nuevamente en unos minutos." },
});
