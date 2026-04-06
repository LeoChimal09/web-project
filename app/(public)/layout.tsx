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
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
