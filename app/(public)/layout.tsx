import CartMiniBar from "@/components/customer/CartMiniBar";
import OrderProgressBanner from "@/components/customer/OrderProgressBanner";
import SiteFooter from "@/components/shared/SiteFooter";
import SiteNavbar from "@/components/shared/SiteNavbar";
import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import { getAuthSession, isAdminSession } from "@/lib/auth";
import { isStripeSandboxMode } from "@/lib/stripe";
import WelcomeModal from "@/components/auth/WelcomeModal";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  const isAuthenticated = Boolean(session?.user?.email);
  const isAdmin = isAdminSession(session);
  const isStripeSandbox = isStripeSandboxMode();
  const navUser = session?.user?.email
    ? {
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        href: isAdmin ? "/admin" : "/orders",
      }
    : null;

  return (
    <>
      <SiteNavbar showAdmin={isAdmin} user={navUser} />
      {isStripeSandbox ? (
        <Container maxWidth="lg" sx={{ pt: 1.5 }}>
          <Alert severity="warning" variant="filled">
            Sandbox Payments: This demo uses Stripe test mode. No real money is charged and all transactions are simulated.
          </Alert>
        </Container>
      ) : null}
      <WelcomeModal isAuthenticated={isAuthenticated} />
      <OrderProgressBanner />
      <CartMiniBar />
      <main style={{ paddingTop: "clamp(16px, 2.5vw, 24px)" }}>{children}</main>
      <SiteFooter />
    </>
  );
}
