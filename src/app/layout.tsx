import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Simi Treinadora | Top2You",
  description: "Sistema Inteligente para Desenvolvimento de Mentores",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen selection:bg-primary/30`}>
        <Navbar />
        <div className="relative flex min-h-screen flex-col pt-16">
          {/* Subtle background glow */}
          <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-background">
            <div className="h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
          </div>
          
          <main className="relative flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
