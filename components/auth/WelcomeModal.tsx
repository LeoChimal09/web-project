"use client";

import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

const GREETED_KEY = "tablestory_greeted";

type Mode = "signin" | "signup";

type WelcomeModalProps = {
  isAuthenticated: boolean;
};

function shouldAutoOpenWelcomeModal(isAuthenticated: boolean) {
  if (typeof window === "undefined") {
    return false;
  }

  if (isAuthenticated) {
    return false;
  }

  return !sessionStorage.getItem(GREETED_KEY);
}

export default function WelcomeModal({ isAuthenticated }: WelcomeModalProps) {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(() => shouldAutoOpenWelcomeModal(isAuthenticated));
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [developmentSignInUrl, setDevelopmentSignInUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setMode("signin");
    setEmail("");
    setName("");
    setError(null);
    setSuccess(null);
    setDevelopmentSignInUrl(null);
    setLoading(false);
  }, []);

  // Listen for manual trigger from navbar button
  useEffect(() => {
    const handleOpen = () => {
      resetForm();
      setOpen(true);
    };
    window.addEventListener("open-welcome-modal", handleOpen);
    return () => window.removeEventListener("open-welcome-modal", handleOpen);
  }, [resetForm]);

  function handleDismiss() {
    sessionStorage.setItem(GREETED_KEY, "1");
    resetForm();
    setOpen(false);
  }

  function handleModeChange(_: React.SyntheticEvent, value: Mode) {
    setMode(value);
    setError(null);
    setSuccess(null);
    setDevelopmentSignInUrl(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDevelopmentSignInUrl(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const response = await fetch("/api/auth/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        name: mode === "signup" ? name.trim() : undefined,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      developmentSignInUrl?: string;
    } | null;

    setLoading(false);

    if (!response.ok) {
      if (payload?.error === "ADMIN_OAUTH_REQUIRED") {
        handleDismiss();
        void signIn("google", { callbackUrl: "/admin" });
        return;
      }

      setError(payload?.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSuccess("Check your email for a secure sign-in link. It expires in 15 minutes.");
    setDevelopmentSignInUrl(payload?.developmentSignInUrl ?? null);
    router.refresh();
  }

  return (
    <Dialog open={open} maxWidth="xs" fullWidth fullScreen={isSmallScreen}>
      <DialogContent>
        <Stack spacing={2.5} sx={{ py: 1 }}>
          {/* Branding */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            spacing={1}
          >
            <RestaurantMenuIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              TableStory
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
          >
            Sign in to track your orders and view your dining history, or
            continue as a guest.
          </Typography>

          {/* Sign in / Create account tabs */}
          <Tabs value={mode} onChange={handleModeChange} centered>
            <Tab label="Sign In" value="signin" />
            <Tab label="Create Account" value="signup" />
          </Tabs>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {mode === "signup" && (
                <TextField
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  size="small"
                  autoComplete="name"
                  autoFocus
                />
              )}
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                size="small"
                autoComplete="email"
                autoFocus={mode === "signin"}
              />
              {error && (
                <Typography variant="caption" color="error">
                  {error}
                </Typography>
              )}
              {success && (
                <Typography variant="caption" color="success.main">
                  {success}
                </Typography>
              )}
              {developmentSignInUrl && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    window.location.href = developmentSignInUrl;
                  }}
                >
                  Open test sign-in link
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading
                  ? "Please wait\u2026"
                  : mode === "signin"
                    ? "Email Me a Sign-In Link"
                    : "Create Account and Email Me a Link"}
              </Button>
            </Stack>
          </Box>

          <Button
            variant="text"
            size="small"
            color="inherit"
            onClick={handleDismiss}
            sx={{ alignSelf: "center" }}
          >
            Continue as guest
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
