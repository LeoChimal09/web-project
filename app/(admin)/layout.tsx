import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SiteNavbar from "@/components/shared/SiteNavbar";
import SignInModal from "@/components/auth/SignInModal";
import { getAuthSession, isAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  const isAdminEnabled = isAdminSession(session);
  const navUser = isAdminEnabled
    ? { name: session?.user?.name ?? null, image: session?.user?.image ?? null, href: "/admin" }
    : null;

  return (
    <>
      <SiteNavbar showAdmin={isAdminEnabled} user={navUser} />
      <main>
        {isAdminEnabled ? (
          children
        ) : (
          <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, textAlign: "center" }}>
            <Stack spacing={3} alignItems="center">
              <Typography variant="overline" color="secondary.main">
                Admin Area Locked
              </Typography>
              <Typography variant="h4">Admin sign-in required</Typography>
              <Typography color="text.secondary">
                Sign in with an allowed GitHub account to access admin-only routes.
              </Typography>
              <SignInModal
                trigger={<Button variant="contained" size="large">Sign in with GitHub</Button>}
              />
            </Stack>
          </Container>
        )}
      </main>
    </>
  );
}
