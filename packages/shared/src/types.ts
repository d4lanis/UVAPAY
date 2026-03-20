export type PaymentStatus = "pending" | "succeeded" | "failed";

export interface StudentInput {
  documentId: string;
  email: string;
  fullName: string;
  phone: string;
}

export interface Student extends StudentInput {
  id: string;
  createdAt: string;
}

export interface PaymentConcept {
  id: string;
  name: string;
  amount: number;
  currency: "MXN";
}

export interface CreatePaymentRequest {
  studentId: string;
  conceptId: string;
}

export interface CreatePaymentResponse {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  transactionId: string | null;
}

export interface PaymentReceipt {
  paymentId: string;
  studentName: string;
  studentEmail: string;
  conceptName: string;
  amount: number;
  currency: string;
  transactionId: string;
  paidAt: string;
}
