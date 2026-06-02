import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
      <body className={`${inter.className} min-h-screen bg-background`}>
        <Navbar />
        <div className="flex min-h-screen flex-col pt-16">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
