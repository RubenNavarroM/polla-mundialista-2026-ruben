import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Polla Mundialista 2026 | Jamar",
  description: "¡Predice los resultados del Mundial FIFA 2026 y compite con tus amigos!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${syne.variable} ${dmSans.variable} antialiased bg-white text-text-primary`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
