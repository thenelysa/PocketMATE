import type { Metadata } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Apply the saved appearance before paint; no user-supplied text is interpolated.
const themeScript = `(function(){var p='system';try{var s=localStorage.getItem('pocketmate_theme');if(s==='light'||s==='dark'||s==='system')p=s}catch(e){}var r=document.documentElement;r.dataset.themePreference=p;r.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p})()`;

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PocketMATE - Bill Management",
  description: "Master Your Bills, Multiply Your Peace",
  manifest: "/manifest.json",
  icons: { icon: "/images/logo-solid.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${dmSerif.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
