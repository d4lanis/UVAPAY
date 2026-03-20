import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Box, Button, Card, CardContent, Container, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { getCurrentStudent, registerStudent } from "../api/client";
import UvaPayShell from "../components/UvaPayShell";

const schema = z.object({
  documentId: z.string().min(5, "Ingresa una matricula válida"),
  fullName: z.string().min(3, "Ingresa tu nombre completo"),
  email: z.email("Ingresa un correo válido"),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      try {
        const existing = await getCurrentStudent();
        navigate("/pago", { state: { student: existing } });
        return;
      } catch {
        // Continue with student creation if profile does not exist.
      }

      const student = await registerStudent(values);
      navigate("/pago", { state: { student } });
    } catch {
      setError("No fue posible registrar el estudiante. Verifica los datos e intenta de nuevo.");
    }
  };

  return (
    <UvaPayShell
      title="Cobros disponibles"
      subtitle="Registra los datos del estudiante para continuar al pago."
    >
      <Container disableGutters>
        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              {error && <Alert severity="error" role="alert" aria-live="polite">{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2}>
                  <TextField
                    label="Matricula"
                    {...register("documentId")}
                    error={!!errors.documentId}
                    helperText={errors.documentId?.message}
                    fullWidth
                    inputProps={{ "aria-required": true }}
                  />
                  <TextField
                    label="Nombre completo"
                    {...register("fullName")}
                    error={!!errors.fullName}
                    helperText={errors.fullName?.message}
                    fullWidth
                    inputProps={{ "aria-required": true }}
                  />
                  <TextField
                    label="Correo institucional"
                    {...register("email")}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    fullWidth
                    inputProps={{ "aria-required": true }}
                  />
                  <TextField
                    label="Teléfono"
                    {...register("phone")}
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    fullWidth
                    inputProps={{ "aria-required": true }}
                  />
                  <Button variant="contained" size="large" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Registrando..." : "Continuar al pago"}
                  </Button>
                  <Link to="/" style={{ textAlign: "center", textDecoration: "none" }}>
                    Volver al login
                  </Link>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </UvaPayShell>
  );
}
