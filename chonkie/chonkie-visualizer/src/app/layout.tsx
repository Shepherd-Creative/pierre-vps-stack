import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chonkie Visualizer",
  description: "Visualize text chunking with different strategies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}