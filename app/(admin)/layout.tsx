import SiteNavbar from "@/components/shared/SiteNavbar";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteNavbar />
      <main>{children}</main>
    </>
  );
}
