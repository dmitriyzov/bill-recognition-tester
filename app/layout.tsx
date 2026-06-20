import type { Metadata } from "next";
import "./styles.css";
import { APP_NAME } from "../lib/config";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Internal tool for testing U.S. bill recognition accuracy."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

