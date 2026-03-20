import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPayment, getConcepts, getCurrentStudent, processPayment } from "../api/client";
import UvaPayShell from "../components/UvaPayShell";
import type { Concept, StudentState } from "../types/state";

interface LocationState {
  student?: StudentState;
}

export default function PaymentPage() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const location = useLocation();
  const { student: routeStudent } = (location.state || {}) as LocationState;

  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [student, setStudent] = useState<StudentState | null>(routeStudent || null);
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) return;

    if (routeStudent) {
      setStudent(routeStudent);
      return;
    }

    getCurrentStudent()
      .then((profile) => setStudent(profile))
      .catch(() => navigate("/estudiante/pagos"));
  }, []);

  useEffect(() => {
    if (!student) {
      return;
    }

    getConcepts()
      .then((items) => {
        setConcepts(items);
        if (items.length > 0) {
          setSelectedConceptId(items[0].id);
        }
      })
      .catch(() => setError("No fue posible cargar los conceptos de pago."));
  }, [student]);

  const selectedConcept = useMemo(
    () => concepts.find((concept) => concept.id === selectedConceptId),
    [concepts, selectedConceptId]
  );

  const hasStripeConfig = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

  const handlePay = async () => {
    if (!student || !selectedConceptId) {
      setError("Selecciona un concepto de pago para continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const creation = await createPayment({
        studentId: student.id,
        conceptId: selectedConceptId,
        idempotencyKey,
      });

      if (!hasStripeConfig) {
        const mockIntentId = `pi_demo_${Date.now()}`;
        const result = await processPayment(creation.paymentId, mockIntentId);
        if (result.status !== "succeeded") {
          throw new Error("No fue posible completar el pago en modo local.");
        }
        navigate(`/exito/${creation.paymentId}`);
        return;
      }

      if (!stripe || !elements) {
        throw new Error("La pasarela de pago aun se esta inicializando. Intenta de nuevo en unos segundos.");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not ready");
      }

      const confirmation = await stripe.confirmCardPayment(creation.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: student.fullName,
            email: student.email,
          },
        },
      });

      if (confirmation.error || !confirmation.paymentIntent) {
        throw new Error(confirmation.error?.message || "No se pudo confirmar el pago");
      }

      const result = await processPayment(creation.paymentId, confirmation.paymentIntent.id);
      if (result.status !== "succeeded") {
        throw new Error("El pago no se completo correctamente");
      }

      navigate(`/exito/${creation.paymentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No fue posible procesar el pago.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!student) {
    return null;
  }

  return (
    <UvaPayShell title="Cobros disponibles" subtitle={`Estudiante: ${student.fullName}`}>
      <Container disableGutters>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2.5}>
              {error && <Alert severity="error" role="alert" aria-live="polite">{error}</Alert>}
              {!hasStripeConfig && (
                <Alert severity="warning">
                  Stripe no esta configurado. Se usara un pago simulado para pruebas locales.
                </Alert>
              )}

              <FormControl fullWidth>
                <InputLabel id="concept-label">Concepto</InputLabel>
                <Select
                  labelId="concept-label"
                  value={selectedConceptId}
                  label="Concepto"
                  onChange={(event) => setSelectedConceptId(event.target.value)}
                >
                  {concepts.map((concept) => (
                    <MenuItem key={concept.id} value={concept.id}>
                      {concept.name} - {concept.currency} {(concept.amount / 100).toLocaleString("es-MX")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {hasStripeConfig && (
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: loading ? "primary.main" : "divider",
                    borderRadius: 2,
                    p: 2,
                    opacity: loading ? 0.6 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  <CardElement options={{ hidePostalCode: true, disabled: loading }} />
                </Box>
              )}
              {loading && (
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                  Procesando pago, por favor espera...
                </Typography>
              )}

              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: 700 }}>
                Total: {selectedConcept?.currency || "MXN"} {((selectedConcept?.amount || 0) / 100).toLocaleString("es-MX") || "0"}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button onClick={handlePay} variant="contained" disabled={loading || !selectedConcept}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Pagar"}
                </Button>
                <Button component={Link} to="/estudiante/pagos" variant="outlined" color="primary">
                  Volver
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </UvaPayShell>
  );
}
