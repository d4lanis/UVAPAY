import {
  Avatar,
  Box,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import React, { useState } from "react";
import type { AuthUser } from "../auth/state";

interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
}

export default function UserMenu({ user, onLogout }: UserMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (open) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        cursor: "pointer",
        py: 0.5,
        px: 1,
        borderRadius: 1,
        transition: "background-color 0.2s",
        "&:hover": {
          bgcolor: "rgba(255,255,255,0.1)",
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: "white",
          color: "#6b0f1a",
          width: { xs: 32, sm: 36 },
          height: { xs: 32, sm: 36 },
          fontSize: { xs: 12, sm: 14 },
          fontWeight: 700,
        }}
      >
        {user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
      </Avatar>

      <Box sx={{ display: { xs: "none", sm: "block" } }}>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: "#fff", lineHeight: 1.2 }}
        >
          {user.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.2 }}
        >
          {user.email}
        </Typography>
      </Box>

      <ArrowDropDownIcon sx={{ color: "rgba(255,255,255,0.7)" }} />

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 160,
            },
          },
        }}
        disableAutoFocusItem
      >
        <MenuItem onClick={handleLogout}>
          <Typography variant="body2">Cerrar sesión</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
