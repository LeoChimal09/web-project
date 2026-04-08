import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import MuiThemeProvider from "@/components/shared/MuiThemeProvider";
import { CartProvider } from "@/features/cart/CartContext";
import { OrderHistoryProvider } from "@/features/checkout/OrderHistoryContext";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Restaurant Web Project",
  description: "MUI remake inspired by a restaurant management reference app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MuiThemeProvider>
          <CartProvider>
            <OrderHistoryProvider>{children}</OrderHistoryProvider>
          </CartProvider>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
