import Stripe from "stripe";
import { env } from "../config/env";

export const stripe = new Stripe(env.stripeSecretKey || "", {
  apiVersion: "2026-02-25.clover",
});

export async function createPaymentIntent(args: {
  amount: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create(
    {
      amount: args.amount,
      currency: args.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: args.metadata,
    },
    { idempotencyKey: args.idempotencyKey }
  );
}
