import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminPayments, getAdminStudents, getPaymentConcepts, createStudentPayment, type AdminStudent, type PaymentConcept } from "../api/client";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";
import type { AdminPaymentDisplayStatus, AdminPaymentItem, AdminPaymentsSummary } from "../types/state";

const statusLabel: Record<AdminPaymentDisplayStatus, string> = {
  pending: "Pendiente",
  succeeded: "Pagado",
  failed: "Fallido",
  expired: "Expirado",
};

const statusColor: Record<AdminPaymentDisplayStatus, "default" | "warning" | "success" | "error"> = {
  pending: "warning",
  succeeded: "success",
  failed: "error",
  expired: "default",
};

const cardConfig = [
  { label: "Creados", key: "created" as const, icon: PersonIcon, color: "#6b0f1a", trendUp: true },
  { label: "Pendientes", key: "pending" as const, icon: ScheduleIcon, color: "#f57c00", trendUp: false },
  { label: "Expirados", key: "expired" as const, icon: WarningIcon, color: "#9e9e9e", trendUp: true },
  { label: "Pagados", key: "succeeded" as const, icon: CheckCircleIcon, color: "#2e7d32", trendUp: true },
  { label: "Fallidos", key: "failed" as const, icon: ErrorIcon, color: "#c62828", trendUp: false },
];

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

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

export default function AdminDashboardPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [summary, setSummary] = useState<AdminPaymentsSummary | null>(null);
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [conceptFilter, setConceptFilter] = useState<string[]>([]);

  // Modal para crear pago
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [concepts, setConcepts] = useState<PaymentConcept[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedConcept, setSelectedConcept] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleOpenCreateDialog = async () => {
    setCreateError(null);
    setSelectedStudent("");
    setSelectedConcept("");
    try {
      const [studentsData, conceptsData] = await Promise.all([
        getAdminStudents(),
        getPaymentConcepts(),
      ]);
      setStudents(studentsData);
      setConcepts(conceptsData);
      setCreateDialogOpen(true);
    } catch {
      setCreateError("No fue posible cargar los datos.");
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setStudents([]);
    setConcepts([]);
    setCreateError(null);
  };

  const handleCreatePayment = async () => {
    if (!selectedStudent || !selectedConcept) return;

    setCreatingPayment(true);
    setCreateError(null);

    try {
      await createStudentPayment(selectedStudent, selectedConcept);
      handleCloseCreateDialog();
      // Recargar pagos
      const data = await getAdminPayments(100);
      setSummary(data.summary);
      setPayments(data.payments);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Error al crear el pago");
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      // El logout ya maneja el estado internamente
    }
  };

  useEffect(() => {
    getAdminPayments(100)
      .then((data) => {
        setSummary(data.summary);
        setPayments(data.payments);
      })
      .catch(() => {
        setError("No fue posible cargar el dashboard de pagos.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Tendencias simuladas (en producción vendrían del backend)
  const trends = useMemo(() => ({
    created: 12,
    pending: -5,
    expired: 8,
    succeeded: 15,
    failed: -3,
  }), []);

  // Obtener conceptos únicos para el filtro
  const uniqueConcepts = useMemo(() => {
    return [...new Set(payments.map((p) => p.conceptName))];
  }, [payments]);

  // Filtrar pagos
  const filteredPayments = useMemo(() => {
    let result = payments;

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.studentName.toLowerCase().includes(term) ||
          p.studentDocumentId.toLowerCase().includes(term) ||
          p.conceptName.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (statusFilter.length > 0) {
      result = result.filter((p) => statusFilter.includes(p.displayStatus));
    }

    // Filtro por concepto
    if (conceptFilter.length > 0) {
      result = result.filter((p) => conceptFilter.includes(p.conceptName));
    }

    // Filtro por fecha
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      result = result.filter((p) => new Date(p.createdAt) >= startDate);
    }

    return result;
  }, [payments, searchTerm, statusFilter, conceptFilter, dateFilter]);

  // Paginación
  const paginatedPayments = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredPayments.slice(start, start + rowsPerPage);
  }, [filteredPayments, page, rowsPerPage]);

  const handleExport = () => {
    const headers = ["Fecha", "Estudiante", "Matricula", "Concepto", "Monto", "Estado", "Pago confirmado"];
    const rows = filteredPayments.map((p) => [
      formatDate(p.createdAt),
      p.studentName,
      p.studentDocumentId,
      p.conceptName,
      `${p.currency} ${p.amount}`,
      statusLabel[p.displayStatus],
      formatDate(p.paidAt),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pagos-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <UvaPayShell
      title="Dashboard Admin"
      subtitle="Monitorea el estado de pagos creados en la plataforma."
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
            <Grid container spacing={1.5}>
              {cardConfig.map((config) => {
                const value = summary ? summary[config.key] : 0;
                const Icon = config.icon;
                const trend = trends[config.key];
                const trendColor = config.trendUp ? "success.main" : "error.main";
                const TrendIcon = config.trendUp ? TrendingUpIcon : TrendingDownIcon;
                return (
                  <Grid key={config.label} size={{ xs: 12, sm: 6, md: 2.4 }}>
                    <Card
                      sx={{
                        borderLeft: 4,
                        borderLeftColor: config.color,
                        transition: "transform 0.2s, box-shadow 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Icon sx={{ fontSize: 18, color: config.color }} />
                          <Typography color="text.secondary" sx={{ fontSize: 13, fontWeight: 500 }}>
                            {config.label}
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={800} sx={{ color: config.color }}>
                          {value}
                        </Typography>
                        {/* Indicador de tendencia */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                          <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
                          <Typography variant="caption" color={trendColor}>
                            {trend > 0 ? "+" : ""}{trend}% vs semana pasada
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* Panel de filtros avanzado */}
            <Card sx={{ bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200" }}>
              <CardContent sx={{ py: 1 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
                  {/* Búsqueda */}
                  <TextField
                    size="small"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(0);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ minWidth: 180 }}
                  />

                  {/* Filtro fecha */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={dateFilter}
                      displayEmpty
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="all">Todas las fechas</MenuItem>
                      <MenuItem value="today">Hoy</MenuItem>
                      <MenuItem value="week">Esta semana</MenuItem>
                      <MenuItem value="month">Este mes</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Filtro estado */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      multiple
                      value={statusFilter}
                      displayEmpty
                      onChange={(e) => {
                        setStatusFilter(e.target.value as string[]);
                        setPage(0);
                      }}
                      renderValue={(selected) =>
                        selected.length === 0 ? "Estado" : `${selected.length} seleccionados`
                      }
                    >
                      {Object.entries(statusLabel).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Filtro concepto */}
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <Select
                      multiple
                      value={conceptFilter}
                      displayEmpty
                      onChange={(e) => {
                        setConceptFilter(e.target.value as string[]);
                        setPage(0);
                      }}
                      renderValue={(selected) =>
                        selected.length === 0 ? "Concepto" : `${selected.length} seleccionados`
                      }
                    >
                      {uniqueConcepts.map((concept) => (
                        <MenuItem key={concept} value={concept}>
                          {concept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ flexGrow: 1 }} />

                  <Tooltip title="Exportar CSV">
                    <IconButton onClick={handleExport} color="primary">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: isMobile ? 1.25 : 0 }}>
                {isMobile ? (
                  <Stack spacing={1}>
                    {paginatedPayments.map((payment) => (
                      <Card key={payment.id} variant="outlined">
                        <CardContent sx={{ p: 1.5 }}>
                          <Stack spacing={1}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                              <Typography fontWeight={700}>{payment.studentName}</Typography>
                              <Chip
                                size="small"
                                label={statusLabel[payment.displayStatus]}
                                color={statusColor[payment.displayStatus]}
                              />
                            </Box>
                            <Divider />
                            <Typography variant="body2" color="text.secondary">
                              Fecha: {formatDate(payment.createdAt)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Matricula: {payment.studentDocumentId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Concepto: {payment.conceptName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Monto: {formatCurrency(payment.amount, payment.currency)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Pago confirmado: {formatDate(payment.paidAt)}
                            </Typography>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                    {paginatedPayments.length === 0 && (
                      <Typography sx={{ textAlign: "center", py: 2 }} color="text.secondary">
                        No hay pagos registrados.
                      </Typography>
                    )}
                  </Stack>
                ) : (
                  <TableContainer>
                    <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.100" }}>
                          <TableCell sx={{ fontWeight: 600, width: "16%" }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: "14%" }}>Estudiante</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: "12%" }}>Matricula</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: "14%" }}>Concepto</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: "12%" }}>Monto</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: "12%" }}>Estado</TableCell>
                          <TableCell sx={{ fontWeight: 600, width: "20%" }}>Pago confirmado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedPayments.map((payment, index) => (
                          <TableRow
                            key={payment.id}
                            hover
                            sx={{
                              bgcolor: index % 2 === 0 ? "white" : "grey.50",
                              "&:hover": { bgcolor: "grey.100" },
                            }}
                          >
                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{payment.studentName}</TableCell>
                            <TableCell>{payment.studentDocumentId}</TableCell>
                            <TableCell>{payment.conceptName}</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontFamily: "monospace" }}>
                              {formatCurrency(payment.amount, payment.currency)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={statusLabel[payment.displayStatus]}
                                color={statusColor[payment.displayStatus]}
                              />
                            </TableCell>
                            <TableCell>{formatDate(payment.paidAt)}</TableCell>
                          </TableRow>
                        ))}
                        {paginatedPayments.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              No hay pagos registrados.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={filteredPayments.length}
                      page={page}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[5, 10, 15]}
                      labelRowsPerPage="Filas por página:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                      sx={{ py: 0 }}
                    />
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </Stack>

      {/* Botón flotante para crear pago */}
      <Box sx={{ position: "fixed", bottom: 24, right: 24 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ px: 3, py: 1.5 }}
        >
          Crear Pago
        </Button>
      </Box>

      {/* Diálogo para crear pago */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Crear Pago para Estudiante</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <Select
                value={selectedStudent}
                displayEmpty
                onChange={(e) => setSelectedStudent(e.target.value)}
              >
                <MenuItem value="">Seleccionar estudiante</MenuItem>
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.fullName} ({student.documentId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <Select
                value={selectedConcept}
                displayEmpty
                onChange={(e) => setSelectedConcept(e.target.value)}
              >
                <MenuItem value="">Seleccionar concepto</MenuItem>
                {concepts.map((concept) => (
                  <MenuItem key={concept.id} value={concept.id}>
                    {concept.name} - ${(concept.amount / 100).toLocaleString("es-MX")} {concept.currency}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancelar</Button>
          <Button
            onClick={handleCreatePayment}
            variant="contained"
            disabled={!selectedStudent || !selectedConcept || creatingPayment}
          >
            {creatingPayment ? <CircularProgress size={20} /> : "Crear Pago"}
          </Button>
        </DialogActions>
      </Dialog>
    </UvaPayShell>
  );
}
