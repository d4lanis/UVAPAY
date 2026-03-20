import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentPayments, type StudentPayment } from "../api/client";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  succeeded: "Pagado",
  failed: "Fallido",
  expired: "Expirado",
};

const statusColor: Record<string, "default" | "warning" | "success" | "error"> = {
  pending: "warning",
  succeeded: "success",
  failed: "error",
  expired: "default",
};

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function StudentPaymentsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [payments, setPayments] = useState<StudentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .then((data) => {
        setPayments(data);
      })
      .catch(() => {
        setError("No fue posible cargar tus pagos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const pendingPayments = useMemo(
    () => payments.filter((p) => p.status === "pending"),
    [payments]
  );

  const completedPayments = useMemo(
    () => payments.filter((p) => p.status !== "pending"),
    [payments]
  );

  const handlePay = (paymentId: string) => {
    navigate(`/pago/simular/${paymentId}`);
  };

  return (
    <UvaPayShell
      title="Mis Pagos"
      subtitle="Consulta tu historial de pagos y realiza pagos pendientes."
      maxWidth="lg"
      user={user}
      onLogout={handleLogout}
      fullHeight
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        {error && <Alert severity="error" role="alert" aria-live="polite">{error}</Alert>}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Pagos Pendientes */}
            {pendingPayments.length > 0 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: "warning.main" }}>
                  Pagos Pendientes ({pendingPayments.length})
                </Typography>
                <Stack spacing={1.5}>
                  {pendingPayments.map((payment) => (
                    <Card
                      key={payment.id}
                      sx={{
                        borderLeft: 4,
                        borderLeftColor: "warning.main",
                      }}
                    >
                      <CardContent sx={{ py: 1.5, px: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                          <Box>
                            <Typography fontWeight={600}>{payment.concept_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Fecha: {formatDate(payment.created_at)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ color: "warning.dark" }}>
                              {formatCurrency(payment.amount, payment.currency)}
                            </Typography>
                            <Button
                              variant="contained"
                              color="warning"
                              onClick={() => handlePay(payment.id)}
                            >
                              Pagar ahora
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Historial de Pagos */}
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
                Historial de Pagos ({completedPayments.length})
              </Typography>
              {completedPayments.length === 0 ? (
                <Typography color="text.secondary">No hay pagos realizados.</Typography>
              ) : isMobile ? (
                <Stack spacing={1}>
                  {completedPayments.map((payment) => (
                    <Card key={payment.id} variant="outlined">
                      <CardContent sx={{ p: 1.5 }}>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography fontWeight={700}>{payment.concept_name}</Typography>
                            <Chip
                              size="small"
                              label={statusLabel[payment.status]}
                              color={statusColor[payment.status]}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            Fecha: {formatDate(payment.created_at)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Monto: {formatCurrency(payment.amount, payment.currency)}
                          </Typography>
                          {payment.paid_at && (
                            <Typography variant="body2" color="text.secondary">
                              Pagado: {formatDate(payment.paid_at)}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Concepto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Pagado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {completedPayments.map((payment, index) => (
                        <TableRow
                          key={payment.id}
                          hover
                          sx={{
                            bgcolor: index % 2 === 0 ? "white" : "grey.50",
                          }}
                        >
                          <TableCell>{formatDate(payment.created_at)}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{payment.concept_name}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                            {formatCurrency(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={statusLabel[payment.status]}
                              color={statusColor[payment.status]}
                            />
                          </TableCell>
                          <TableCell>{formatDate(payment.paid_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </>
        )}
      </Stack>
    </UvaPayShell>
  );
}
