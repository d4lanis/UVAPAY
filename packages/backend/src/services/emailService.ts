import { Resend } from "resend";
import { env } from "../config/env";

const resend = new Resend(env.resendApiKey || "");

export async function sendPaymentConfirmationEmail(args: {
  to: string;
  studentName: string;
  conceptName: string;
  amount: number;
  currency: string;
  transactionId: string;
}): Promise<void> {
  if (!env.resendApiKey) {
    return;
  }

  await resend.emails.send({
    from: env.fromEmail,
    to: args.to,
    subject: "Pago recibido - Universidad",
    html: `
      <h2>Pago recibido correctamente</h2>
      <p>Hola ${args.studentName},</p>
      <p>Recibimos tu pago por <strong>${args.conceptName}</strong>.</p>
      <ul>
        <li>Monto: ${args.currency} ${args.amount.toLocaleString("es-MX")}</li>
        <li>Transaccion: ${args.transactionId}</li>
      </ul>
      <p>Conserva este correo como constancia preliminar.</p>
    `,
  });
}
