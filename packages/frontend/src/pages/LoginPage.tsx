import { Alert, Box, Button, Card, CardContent, Checkbox, Divider, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { getAuthProviders } from "../api/client";
import { useAuth } from "../auth/useAuth";
import UvaPayShell from "../components/UvaPayShell";

const schema = z.object({
  email: z.email("Ingresa un correo válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { loginWithEmail, signInWithProvider, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const targetPath = (location.state as { from?: string } | undefined)?.from || (isAdmin ? "/admin" : "/estudiante/pagos");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  useEffect(() => {
    getAuthProviders()
      .then((items) => setProviders(items))
      .catch(() => setProviders([]));
  }, []);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await loginWithEmail(values.email, values.password);
      const destination = isAdmin ? "/admin" : "/estudiante/pagos";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesion");
    }
  };

  const onSocial = async (provider: string) => {
    setError(null);
    setSocialLoading(provider);
    try {
      await signInWithProvider(provider, `${window.location.origin}${targetPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesion social");
      setSocialLoading(null);
    }
  };

  return (
    <UvaPayShell title="Iniciar sesion" subtitle="Accede para continuar con pagos y dashboard admin.">
      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            {error && <Alert severity="error" role="alert" aria-live="polite">{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2}>
                <TextField
                  label="Correo"
                  {...register("email")}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                  inputProps={{
                    "aria-required": true,
                    "aria-describedby": errors.email ? "email-error" : undefined,
                  }}
                />
                <TextField
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  fullWidth
                  inputProps={{
                    "aria-required": true,
                    "aria-describedby": errors.password ? "password-error" : undefined,
                    autoComplete: "current-password",
                  }}
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
                <FormControlLabel
                  control={<Checkbox {...register("rememberMe")} />}
                  label="Recordarme"
                />
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </Button>
              </Stack>
            </Box>

            {providers.length > 0 && (
              <>
                <Divider>o continúa con</Divider>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  {providers.map((provider) => (
                    <Button
                      key={provider}
                      variant="outlined"
                      disabled={socialLoading === provider}
                      onClick={() => onSocial(provider)}
                      aria-label={`Iniciar sesión con ${provider}`}
                    >
                      {socialLoading === provider ? "Conectando..." : provider}
                    </Button>
                  ))}
                </Stack>
              </>
            )}

            <Typography variant="body2" color="text.secondary">
              ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ¿Olvidaste la contraseña? <Link to="/forgot-password">Recuperar acceso</Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </UvaPayShell>
  );
}
