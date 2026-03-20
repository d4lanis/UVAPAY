import PDFDocument from "pdfkit";
import type { PaymentReceipt } from "shared";

export function generateReceiptPdf(receipt: PaymentReceipt): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Comprobante de pago universitario", { align: "left" });
    doc.moveDown();

    doc.fontSize(12).text(`Pago ID: ${receipt.paymentId}`);
    doc.text(`Transaccion: ${receipt.transactionId}`);
    doc.text(`Fecha: ${new Date(receipt.paidAt).toLocaleString("es-MX")}`);
    doc.moveDown();

    doc.text(`Estudiante: ${receipt.studentName}`);
    doc.text(`Email: ${receipt.studentEmail}`);
    doc.text(`Concepto: ${receipt.conceptName}`);
    doc.text(`Monto: ${receipt.currency} ${receipt.amount.toLocaleString("es-MX")}`);

    doc.moveDown();
    doc.text("Documento generado por el sistema de pasarela de pagos.");
    doc.end();
  });
}
