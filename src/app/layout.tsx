import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainFlow",
  description: "BrainFlow dashboards for collaborative brainstorming and team operations.",
  icons: {
    icon: "/2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className="h-full scroll-smooth antialiased"
    >
      <body className="min-h-full flex flex-col bg-background text-[#1a1f2c]">{children}</body>
    </html>
  );
}
