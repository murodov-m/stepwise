import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StepWise",
  description: "Turn administrative paperwork into a clear action plan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
