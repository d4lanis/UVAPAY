export interface StudentFormValues {
  documentId: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface StudentState extends StudentFormValues {
  id: string;
}

export interface Concept {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

export interface PaymentCreation {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

export type AdminPaymentDisplayStatus = "pending" | "succeeded" | "failed" | "expired";

export interface AdminPaymentsSummary {
  created: number;
  pending: number;
  expired: number;
  succeeded: number;
  failed: number;
}

export interface AdminPaymentItem {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed";
  displayStatus: AdminPaymentDisplayStatus;
  createdAt: string;
  paidAt: string | null;
  transactionId: string | null;
  studentName: string;
  studentDocumentId: string;
  conceptName: string;
}

export interface AdminPaymentsResponse {
  summary: AdminPaymentsSummary;
  payments: AdminPaymentItem[];
}
