import axios from "axios";
import type {
  AdminPaymentsResponse,
  Concept,
  PaymentCreation,
  StudentFormValues,
  StudentState,
} from "../types/state";
import { API_URL } from "./baseUrl";

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Interceptor para detectar sesión expirada (401)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("session:expired"));
    }
    return Promise.reject(error);
  }
);

export async function registerStudent(input: StudentFormValues): Promise<StudentState> {
  const { data } = await client.post("/api/students", input);

  return {
    id: data.id,
    documentId: data.documentId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
  };
}

export async function getConcepts(): Promise<Concept[]> {
  const { data } = await client.get("/api/payment-concepts");
  return data;
}

export async function getCurrentStudent(): Promise<StudentState> {
  const { data } = await client.get("/api/students/me");
  return data;
}

export async function createPayment(payload: {
  studentId: string;
  conceptId: string;
  idempotencyKey: string;
}): Promise<PaymentCreation> {
  const { data } = await client.post("/api/payments", payload);
  return data;
}

export async function processPayment(paymentId: string, paymentIntentId: string) {
  const { data } = await client.post(`/api/payments/${paymentId}/process`, {
    paymentIntentId,
  });
  return data as { paymentId: string; status: "succeeded" | "failed"; transactionId: string | null };
}

export function getReceiptUrl(paymentId: string): string {
  return `${API_URL}/api/payments/${paymentId}/receipt`;
}

export interface StudentPayment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "expired";
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  concept_name: string;
}

export async function getStudentPayments(): Promise<StudentPayment[]> {
  const { data } = await client.get("/api/payments/my-payments");
  return data;
}

export async function simulatePayment(paymentId: string): Promise<{ paymentId: string; status: string; transactionId: string }> {
  const { data } = await client.post(`/api/payments/${paymentId}/simulate`);
  return data;
}

export async function getAdminPayments(limit = 50): Promise<AdminPaymentsResponse> {
  const { data } = await client.get("/api/admin/payments", { params: { limit } });
  return data;
}

export interface AdminStudent {
  id: string;
  documentId: string;
  email: string;
  fullName: string;
}

export async function getAdminStudents(): Promise<AdminStudent[]> {
  const { data } = await client.get("/api/admin/students");
  return data;
}

export interface PaymentConcept {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

export async function getPaymentConcepts(): Promise<PaymentConcept[]> {
  const { data } = await client.get("/api/admin/concepts");
  return data;
}

export interface CreatePaymentResponse {
  paymentId: string;
  studentId: string;
  studentName: string;
  conceptId: string;
  conceptName: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createStudentPayment(studentId: string, conceptId: string): Promise<CreatePaymentResponse> {
  const { data } = await client.post("/api/admin/payments", { studentId, conceptId });
  return data;
}

export async function getAuthProviders(): Promise<string[]> {
  const { data } = await client.get("/api/auth/providers");
  return (data?.providers || []) as string[];
}
