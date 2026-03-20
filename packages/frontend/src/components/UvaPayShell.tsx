import { Box, Container, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { Breakpoint } from "@mui/material/styles";
import type { AuthUser } from "../auth/state";
import UserMenu from "./UserMenu";

interface UvaPayShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  maxWidth?: Breakpoint;
  user?: AuthUser | null;
  onLogout?: () => void;
  fullHeight?: boolean;
}

export default function UvaPayShell({
  title,
  subtitle,
  children,
  maxWidth = "md",
  user,
  onLogout,
  fullHeight = false,
}: UvaPayShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", pb: fullHeight ? 0 : 5, overflow: fullHeight ? "hidden" : "auto" }}>
      <Box
        component="header"
        sx={{
          background: "linear-gradient(145deg, #6b0f1a, #7f1624)",
          color: "#fff",
          px: { xs: 1, sm: 3 },
          py: { xs: 1, md: 1 },
          boxShadow: "0 8px 24px rgba(77, 11, 20, 0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" fontWeight={800} letterSpacing={0.8} sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.125rem" } }}>
            UVA PAY
          </Typography>
          <Typography sx={{ opacity: 0.86, mt: 0.4, fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.98rem" }, display: { xs: "none", sm: "block" } }}>
            Pagos universitarios 100% digitales
          </Typography>
        </Box>

        {user && onLogout && (
          <Box sx={{ position: "absolute", right: { xs: 1, sm: 2 } }}>
            <UserMenu user={user} onLogout={onLogout} />
          </Box>
        )}
      </Box>

      <Container maxWidth={maxWidth} sx={{ mt: 2, flex: 1, overflow: "auto" }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "primary.dark" }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        </Box>

        {children}
      </Container>
    </Box>
  );
}
