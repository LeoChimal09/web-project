"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8f2d1f",
    },
    secondary: {
      main: "#2a5f4d",
    },
    background: {
      default: "#f7f1e8",
      paper: "#fffdf8",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Trebuchet MS", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    h2: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
});

type MuiThemeProviderProps = {
  children: ReactNode;
};

export default function MuiThemeProvider({ children }: MuiThemeProviderProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
