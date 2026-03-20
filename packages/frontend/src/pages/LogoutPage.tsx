import { Alert, Button, Card, CardContent, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";

export default function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cerrar sesion");
    }
  };

  return (
    <UvaPayShell title="Cerrar sesion" subtitle="Finaliza tu sesion actual de manera segura.">
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Button variant="contained" onClick={handleLogout}>
              Confirmar cierre de sesion
            </Button>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Volver
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </UvaPayShell>
  );
}
