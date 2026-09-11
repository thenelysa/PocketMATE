import type { Metadata } from "next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Providers } from '@/providers';
import "./globals.css";

export const metadata: Metadata = {
  title: "PocketMATE - Bill Management",
  description: "Master Your Bills, Multiply Your Peace",
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <Providers>{children}</Providers>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
