import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";

export const metadata: Metadata = {
  title: "InternPilot — AI Internship & Scholarship Hub for Uganda",
  description: "AI-guided career hub empowering Ugandan university students to discover, track, and apply for verified tech internships and scholarships on time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-gray-100 dark:bg-background dark:text-gray-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-300">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

