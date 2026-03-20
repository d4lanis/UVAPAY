import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";

const schema = z.object({
  email: z.email("Ingresa un correo valido"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccess(null);

    try {
      await requestPasswordReset(values.email);
      setSuccess("Si el correo existe, enviamos un enlace de recuperacion.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible procesar la solicitud");
    }
  };

  return (
    <UvaPayShell title="Recuperar contrasena" subtitle="Solicita un enlace de recuperacion para restablecer tu acceso.">
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              El enlace se enviara al correo registrado en la plataforma.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <TextField label="Correo" {...register("email")} error={!!errors.email} helperText={errors.email?.message} />
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : "Enviar enlace"}
                </Button>
                <Link to="/" style={{ textAlign: "center", textDecoration: "none" }}>
                  Volver al login
                </Link>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </UvaPayShell>
  );
}
