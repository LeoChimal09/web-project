import CartMiniBar from "@/components/customer/CartMiniBar";
import OrderProgressBanner from "@/components/customer/OrderProgressBanner";
import SiteFooter from "@/components/shared/SiteFooter";
import SiteNavbar from "@/components/shared/SiteNavbar";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteNavbar />
      <OrderProgressBanner />
      <CartMiniBar />
      <main style={{ paddingTop: "24px" }}>{children}</main>
      <SiteFooter />
    </>
  );
}
