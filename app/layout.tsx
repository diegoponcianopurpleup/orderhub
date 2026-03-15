import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrderHub Core",
  description: "Sistema white-label de pedidos e comandas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-100 text-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </body>
    </html>
  );
}