import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video OS",
  description: "Watch your Remotion project — see every video, render, export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
