import { Alert, Box, Button, Card, CardContent, IconButton, InputAdornment, Stack, TextField } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { registerStudent } from "../api/client";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";

const schema = z.object({
  fullName: z.string().min(3, "Ingresa tu nombre completo"),
  documentId: z.string().min(5, "Ingresa una matricula válida"),
  email: z.email("Ingresa un correo válido"),
  phone: z.string().min(7, "Ingresa un teléfono válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  passwordConfirm: z.string().min(8, "Confirma tu contraseña"),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Las contraseñas no coinciden",
  path: ["passwordConfirm"],
});

type FormValues = z.infer<typeof schema>;

export default function AuthRegisterPage() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await registerWithEmail(values.fullName, values.email, values.password);

      const student = await registerStudent({
        documentId: values.documentId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
      });

      navigate("/pago", { state: { student } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible completar el registro");
    }
  };

  return (
    <UvaPayShell title="Crear cuenta" subtitle="Completa tu información para comenzar a usar la plataforma.">
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            {error && <Alert severity="error" role="alert" aria-live="polite">{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <TextField label="Nombre completo" {...register("fullName")} error={!!errors.fullName} helperText={errors.fullName?.message} fullWidth inputProps={{ "aria-required": true }} />
                <TextField label="Matricula" {...register("documentId")} error={!!errors.documentId} helperText={errors.documentId?.message} fullWidth inputProps={{ "aria-required": true }} />
                <TextField label="Correo" {...register("email")} error={!!errors.email} helperText={errors.email?.message} fullWidth inputProps={{ "aria-required": true }} />
                <TextField label="Teléfono" {...register("phone")} error={!!errors.phone} helperText={errors.phone?.message} fullWidth inputProps={{ "aria-required": true }} />
                <TextField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  fullWidth
                  inputProps={{ "aria-required": true, autoComplete: "new-password" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirmar contraseña"
                  type={showPasswordConfirm ? "text" : "password"}
                  {...register("passwordConfirm")}
                  error={!!errors.passwordConfirm}
                  helperText={errors.passwordConfirm?.message}
                  fullWidth
                  inputProps={{ "aria-required": true, autoComplete: "new-password" }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPasswordConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          edge="end"
                        >
                          {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Creando..." : "Crear cuenta"}
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
