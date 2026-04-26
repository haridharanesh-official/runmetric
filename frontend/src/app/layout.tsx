import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/AuthContext";
import { PerformanceProvider } from "@/lib/PerformanceContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "RunMetric - AI Performance Analytics",
  description: "Next-generation running tracking and AI coaching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0e1a] text-[#f1f5f9] min-h-screen antialiased selection:bg-[#3b82f6]/30 overflow-x-hidden`}>
        <AuthProvider>
          <PerformanceProvider>
            <Navbar />
            <div className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
              {children}
            </div>
          </PerformanceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
