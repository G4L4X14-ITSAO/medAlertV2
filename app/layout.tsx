import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedAlert",
  description: "Plataforma de monitoreo y seguimiento clínico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#f4f1ea] text-slate-950">
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        {children}
      </body>
    </html>
  );
}
