import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: "Petwo",
  description: "A little world for two.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-petwo.png",
    apple: "/logo-petwo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#346574",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${beVietnam.variable} font-body antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
