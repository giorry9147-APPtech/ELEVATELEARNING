import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { BrandingProvider } from "@/components/BrandingProvider";
import CookieBanner from "@/components/CookieBanner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Professioneel platform voor online lesgeven",
  description:
    "Video, live whiteboard en chat in één scherm. Geen downloads, klik op een link en je zit in de les.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <BrandingProvider>
            {children}
            <CookieBanner />
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
