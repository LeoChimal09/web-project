"use client";

import GoogleIcon from "@mui/icons-material/Google";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { signIn } from "next-auth/react";
import { useState } from "react";

type SignInModalProps = {
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
  callbackUrl?: string;
};

export default function SignInModal({
  trigger,
  callbackUrl = "/admin",
}: SignInModalProps) {
  const [open, setOpen] = useState(false);

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
              Only approved Google accounts listed in the admin allowlist can
              access staff routes.
            </Typography>
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
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
