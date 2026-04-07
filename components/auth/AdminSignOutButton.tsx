"use client";

import Button from "@mui/material/Button";
import { signOut } from "next-auth/react";

export default function AdminSignOutButton() {
  return (
    <Button
      variant="outlined"
      color="inherit"
      onClick={() => {
        void signOut({ callbackUrl: "/" });
      }}
    >
      Sign Out
    </Button>
  );
}
