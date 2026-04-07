import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import SiteNavbar from "@/components/shared/SiteNavbar";
import { isAdminModeEnabled } from "@/lib/admin-access";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdminEnabled = isAdminModeEnabled();

  return (
    <>
      <SiteNavbar showAdmin={isAdminEnabled} />
      <main>
        {isAdminEnabled ? (
          children
        ) : (
          <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
            <Stack spacing={3}>
              <Typography variant="overline" color="secondary.main">
                Admin Area Locked
              </Typography>
              <Typography variant="h4">Admin test mode is disabled</Typography>
              <Typography color="text.secondary">
                Set `ADMIN_TEST_MODE=true` in your `.env` file to access admin-only routes during local testing.
              </Typography>
              <Button variant="contained" LinkComponent={Link} href="/">
                Back to Home
              </Button>
            </Stack>
          </Container>
        )}
      </main>
    </>
  );
}
