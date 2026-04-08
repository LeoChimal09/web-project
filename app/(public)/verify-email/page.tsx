"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your link...");

  useEffect(() => {
    let cancelled = false;

    async function runVerification() {
      const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
      const token = searchParams.get("token")?.trim() ?? "";

      if (!email || !token) {
        if (!cancelled) {
          setStatus("error");
          setMessage("This verification link is invalid.");
        }
        return;
      }

      const result = await signIn("credentials", {
        email,
        verificationToken: token,
        redirect: false,
      });

      if (cancelled) {
        return;
      }

      if (result?.ok) {
        setStatus("success");
        setMessage("You are signed in. Redirecting...");
        window.location.href = "/";
        return;
      }

      setStatus("error");
      setMessage("This link is invalid or expired. Please request a new one.");
    }

    void runVerification();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <Box sx={{ backgroundColor: "background.default", minHeight: "70vh", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Stack spacing={2.5}>
          <Typography variant="h4">Email verification</Typography>
          {status === "loading" && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography>{message}</Typography>
            </Stack>
          )}
          {status === "success" && <Alert severity="success">{message}</Alert>}
          {status === "error" && <Alert severity="error">{message}</Alert>}
          <Button component={Link} href="/" variant="contained">
            Back to home
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
