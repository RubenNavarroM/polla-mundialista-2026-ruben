import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
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

/* Prevents flash of wrong theme on initial load */
const themeScript = `
(function(){
  var t=localStorage.getItem('theme')||'system';
  var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(t==='dark'||(t==='system'&&d)){document.documentElement.classList.add('dark');}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Inline script runs synchronously before paint to avoid theme flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${syne.variable} ${dmSans.variable} antialiased bg-bg text-text-primary`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
