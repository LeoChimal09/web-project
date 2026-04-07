import CartMiniBar from "@/components/customer/CartMiniBar";
import OrderProgressBanner from "@/components/customer/OrderProgressBanner";
import SiteFooter from "@/components/shared/SiteFooter";
import SiteNavbar from "@/components/shared/SiteNavbar";
import { getAuthSession, isAdminSession } from "@/lib/auth";
import WelcomeModal from "@/components/auth/WelcomeModal";

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuthSession();
  const isAuthenticated = Boolean(session?.user?.email);
  const isAdmin = isAdminSession(session);
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
      <WelcomeModal isAuthenticated={isAuthenticated} />
      <OrderProgressBanner />
      <CartMiniBar />
      <main style={{ paddingTop: "24px" }}>{children}</main>
      <SiteFooter />
    </>
  );
}
