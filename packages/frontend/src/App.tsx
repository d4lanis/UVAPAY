import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AuthRegisterPage from "./pages/AuthRegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LoginPage from "./pages/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import PaymentPage from "./pages/PaymentPage";
import RegisterPage from "./pages/RegisterPage";
import SimulatedPaymentPage from "./pages/SimulatedPaymentPage";
import StudentPaymentsPage from "./pages/StudentPaymentsPage";
import SuccessPage from "./pages/SuccessPage";

const theme = createTheme({
  palette: {
    primary: { main: "#8b1c2e", dark: "#6b0f1a", light: "#ab3f52" },
    secondary: { main: "#6b0f1a" },
    background: { default: "#f4f4f4", paper: "#ffffff" },
    text: { primary: "#2d1b1f", secondary: "#6f5b5e" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Sora', 'Segoe UI', sans-serif",
    h3: { fontSize: "2rem", fontWeight: 800 },
    h4: { fontSize: "1.7rem", fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          textTransform: "none",
        },
      },
    },
  },
});

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Elements stripe={stripePromise}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<AuthRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            <Route
              path="/pago/registro"
              element={
                <ProtectedRoute requireAdmin>
                  <RegisterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pago"
              element={
                <ProtectedRoute requireAdmin>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exito/:paymentId"
              element={
                <ProtectedRoute>
                  <SuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estudiante/pagos"
              element={
                <ProtectedRoute>
                  <StudentPaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pago/simular/:paymentId"
              element={
                <ProtectedRoute>
                  <SimulatedPaymentPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </Elements>
    </ThemeProvider>
  );
}

export default App;
