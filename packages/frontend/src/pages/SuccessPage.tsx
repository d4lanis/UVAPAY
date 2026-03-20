import { Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { getReceiptUrl } from "../api/client";
import UvaPayShell from "../components/UvaPayShell";

export default function SuccessPage() {
  const { paymentId = "" } = useParams();

  return (
    <UvaPayShell title="Historial de pagos" subtitle="Tu ultimo pago fue registrado correctamente.">
      <Container maxWidth="sm" disableGutters>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Typography variant="h5" fontWeight={700}>
                Pago recibido
              </Typography>
              <Typography color="text.secondary">
                Tu transaccion fue registrada exitosamente. Recibiras un correo de confirmacion.
              </Typography>
              <Button variant="outlined" href={getReceiptUrl(paymentId)} target="_blank" color="primary">
                Descargar comprobante PDF
              </Button>
              <Button component={Link} to="/estudiante/pagos" variant="contained">
                Registrar otro pago
              </Button>
              <Button component={Link} to="/logout" variant="outlined" color="primary">
                Cerrar sesion
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </UvaPayShell>
  );
}
