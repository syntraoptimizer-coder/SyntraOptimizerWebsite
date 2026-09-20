import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Velyro Optimizer — Your PC, unleashed.",
  description: "A cleaner system. A smoother experience. Discover Velyro Optimizer, the PC optimization tool built to put you in control.",
  icons: { icon: "/assets/syntra-logo.png", shortcut: "/assets/syntra-logo.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
