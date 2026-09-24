import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import SmoothScroll from "@/components/SmoothScroll";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Velyro Optimizer — Your PC, unleashed.",
  description: "A cleaner system. A smoother experience. Discover Velyro Optimizer, the PC optimization tool built to put you in control.",
  icons: { icon: "/assets/syntra-logo.png", shortcut: "/assets/syntra-logo.png" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" data-motion="full">
      <head>
        {/* Applies the saved theme before the first paint. Without it the served HTML always carries
            the default and anyone on the other theme gets a flash on every navigation. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <SmoothScroll>
          {children}
          <CookieConsent />
        </SmoothScroll>
      </body>
    </html>
  );
}
