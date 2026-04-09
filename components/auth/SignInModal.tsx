"use client";

import GoogleIcon from "@mui/icons-material/Google";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

type SignInModalProps = {
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
  callbackUrl?: string;
};

export default function SignInModal({
  trigger,
  callbackUrl = "/admin",
}: SignInModalProps) {
  const [open, setOpen] = useState(false);
  const [requiresOAuth, setRequiresOAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [developmentSignInUrl, setDevelopmentSignInUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadMode() {
      const response = await fetch("/api/auth/account-role", { cache: "no-store" }).catch(() => null);
      const payload = response ? ((await response.json().catch(() => null)) as { requiresOAuth?: boolean } | null) : null;
      if (!cancelled && payload) {
        setRequiresOAuth(payload.requiresOAuth !== false);
      }
    }

    void loadMode();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const triggerWithHandler = {
    ...trigger,
    props: {
      ...trigger.props,
      onClick: () => setOpen(true),
    },
  };

  return (
    <>
      {triggerWithHandler}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogContent>
          <Stack spacing={3} sx={{ py: 2, textAlign: "center", alignItems: "center" }}>
            <Typography variant="overline" color="secondary.main">
              Admin Sign In
            </Typography>
            <Typography variant="h6">Sign in to access the admin area</Typography>
            <Typography variant="body2" color="text.secondary">
              {requiresOAuth
                ? "Only approved Google accounts listed in the admin allowlist can access staff routes."
                : "Request a secure admin sign-in link using an allowlisted test-mode email address."}
            </Typography>
            {requiresOAuth ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                onClick={() => {
                  setOpen(false);
                  void signIn("google", { callbackUrl });
                }}
              >
                Sign in with Google
              </Button>
            ) : (
              <Stack spacing={2} sx={{ width: "100%" }}>
                <TextField
                  label="Admin Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                  size="small"
                  autoComplete="email"
                />
                {error && (
                  <Typography variant="caption" color="error" textAlign="left">
                    {error}
                  </Typography>
                )}
                {success && (
                  <Typography variant="caption" color="success.main" textAlign="left">
                    {success}
                  </Typography>
                )}
                {developmentSignInUrl && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      window.location.href = developmentSignInUrl;
                    }}
                  >
                    Open admin test sign-in link
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    setDevelopmentSignInUrl(null);

                    const normalizedEmail = email.trim().toLowerCase();
                    const response = await fetch("/api/auth/request-link", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: normalizedEmail, adminIntent: true }),
                    });

                    const payload = (await response.json().catch(() => null)) as
                      | { error?: string; developmentSignInUrl?: string; directAdminSignIn?: boolean }
                      | null;

                    setLoading(false);

                    if (!response.ok) {
                      setError(payload?.error ?? "Unable to send admin sign-in link.");
                      return;
                    }

                    if (payload?.directAdminSignIn) {
                      const result = await signIn("credentials", {
                        email: normalizedEmail,
                        password: "test",
                        adminIntent: "true",
                        redirect: false,
                      });

                      if (result?.ok) {
                        setOpen(false);
                        setEmail("");
                        setError(null);
                        setSuccess(null);
                        setDevelopmentSignInUrl(null);
                        return;
                      }

                      setError("Test admin sign-in failed. Please verify test mode settings.");
                      return;
                    }

                    setSuccess("Check your email for an admin sign-in link. It expires in 15 minutes.");
                    setDevelopmentSignInUrl(payload?.developmentSignInUrl ?? null);
                  }}
                >
                  {loading ? "Please wait..." : "Email Me an Admin Sign-In Link"}
                </Button>
              </Stack>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
