"use client";

import Button from "@mui/material/Button";
import { signIn } from "next-auth/react";

type GitHubSignInButtonProps = {
  callbackUrl?: string;
};

export default function GitHubSignInButton({ callbackUrl = "/admin" }: GitHubSignInButtonProps) {
  return (
    <Button
      variant="contained"
      onClick={() => {
        void signIn("github", { callbackUrl });
      }}
    >
      Sign in with GitHub
    </Button>
  );
}
