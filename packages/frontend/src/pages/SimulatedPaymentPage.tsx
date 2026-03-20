import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentPayments, simulatePayment, type StudentPayment } from "../api/client";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 2) {
    return digits.slice(0, 2) + "/" + digits.slice(2);
  }
  return digits;
}

export default function SimulatedPaymentPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [payment, setPayment] = useState<StudentPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Datos de la tarjeta (no se guardan, solo para simulación)
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      // El logout ya maneja el estado internamente
    }
  };

  useEffect(() => {
    getStudentPayments()
      .then((payments) => {
        const found = payments.find((p) => p.id === paymentId);
        if (found) {
          setPayment(found);
        } else {
          setError("Pago no encontrado");
        }
      })
      .catch(() => {
        setError("No fue posible cargar los detalles del pago.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [paymentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId) return;

    setProcessing(true);
    setError(null);

    try {
      await simulatePayment(paymentId);
      setSuccess(true);
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/estudiante/pagos");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <UvaPayShell
        title="Pago"
        subtitle="Procesando..."
        user={user}
        onLogout={handleLogout}
      >
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      </UvaPayShell>
    );
  }

  if (success) {
    return (
      <UvaPayShell
        title="Pago Exitoso"
        subtitle="Tu pago ha sido procesado correctamente."
        user={user}
        onLogout={handleLogout}
      >
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h3" sx={{ color: "success.main", mb: 2 }}>
            ✓
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
            Pago realizado con éxito
          </Typography>
          <Typography color="text.secondary">
            Serás redirigido a tus pagos en unos segundos...
          </Typography>
        </Box>
      </UvaPayShell>
    );
  }

  if (!payment) {
    return (
      <UvaPayShell
        title="Pago"
        subtitle="Error"
        user={user}
        onLogout={handleLogout}
      >
        <Alert severity="error">{error || "Pago no encontrado"}</Alert>
      </UvaPayShell>
    );
  }

  return (
    <UvaPayShell
      title="Pago"
      subtitle={`Pago de ${payment.concept_name}`}
      user={user}
      onLogout={handleLogout}
    >
      <Stack spacing={3}>
        {/* Resumen del pago */}
        <Card sx={{ bgcolor: "grey.50" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
              Resumen del pago
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography color="text.secondary">Concepto</Typography>
                <Typography fontWeight={600}>{payment.concept_name}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography color="text.secondary">Monto total</Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: "primary.main" }}>
                  {formatCurrency(payment.amount, payment.currency)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Formulario de tarjeta */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Datos de tarjeta
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Número de tarjeta"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="1234 5678 9012 3456"
                  fullWidth
                  required
                  inputProps={{ maxLength: 19 }}
                />
                <TextField
                  label="Nombre del titular"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Juan Perez"
                  fullWidth
                  required
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label="Vencimiento"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    fullWidth
                    required
                    inputProps={{ maxLength: 5 }}
                  />
                  <TextField
                    label="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="123"
                    fullWidth
                    required
                    inputProps={{ maxLength: 3 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Nota: Esta es una simulación. No se guardará ningún dato de tu tarjeta.
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={processing || !cardNumber || !cardName || !expiry || !cvv}
                    sx={{ flex: 1 }}
                  >
                    {processing ? <CircularProgress size={24} color="inherit" /> : "Pagar ahora"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/estudiante/pagos")}
                    disabled={processing}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </UvaPayShell>
  );
}
