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
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

const GREETED_KEY = "tablestory_greeted";

type Mode = "signin" | "signup";

type WelcomeModalProps = {
  isAuthenticated: boolean;
};

async function isAdminAccountEmail(email: string) {
  try {
    const params = new URLSearchParams({ email });
    const response = await fetch(`/api/auth/account-role?${params.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json().catch(() => null)) as { isAdmin?: boolean } | null;
    return payload?.isAdmin === true;
  } catch {
    return false;
  }
}

export default function WelcomeModal({ isAuthenticated }: WelcomeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen for manual trigger from navbar button
  useEffect(() => {
    const handleOpen = () => {
      resetForm();
      setOpen(true);
    };
    window.addEventListener("open-welcome-modal", handleOpen);
    return () => window.removeEventListener("open-welcome-modal", handleOpen);
  }, []);

  // Auto-show on first visit if not signed in
  useEffect(() => {
    if (isAuthenticated) return;
    if (sessionStorage.getItem(GREETED_KEY)) return;
    resetForm();
    setOpen(true);
  }, [isAuthenticated]);

  function resetForm() {
    setMode("signin");
    setEmail("");
    setName("");
    setError(null);
    setLoading(false);
  }

  function handleDismiss() {
    sessionStorage.setItem(GREETED_KEY, "1");
    resetForm();
    setOpen(false);
  }

  function handleModeChange(_: React.SyntheticEvent, value: Mode) {
    setMode(value);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const shouldUseAdminAuth = await isAdminAccountEmail(normalizedEmail);

    if (shouldUseAdminAuth) {
      handleDismiss();
      void signIn("github", { callbackUrl: "/admin" });
      return;
    }

    const result = await signIn("credentials", {
      email: normalizedEmail,
      name: mode === "signup" ? name.trim() : "",
      redirect: false,
    });

    setLoading(false);

    const errorCode = result?.error;

    if (!result || result.error || !result.ok) {
      if (errorCode === "ACCOUNT_NOT_FOUND") {
        setError('No account found. Switch to "Create Account" to register.');
      } else if (errorCode === "ADMIN_OAUTH_REQUIRED") {
        setError("Admin accounts must use Sign in with GitHub below.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } else {
      handleDismiss();
      router.refresh();
    }
  }

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
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
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading
                  ? "Please wait\u2026"
                  : mode === "signin"
                    ? "Sign In"
                    : "Create Account"}
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
