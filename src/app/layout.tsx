import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { getOrgConfig } from "@/lib/org-config";
import { MilesChat } from "@/components/miles-chat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orgConfig = getOrgConfig();

export const metadata: Metadata = {
  title: {
    default: orgConfig.name,
    template: `%s | ${orgConfig.name}`,
  } as Metadata["title"],
  description: `A ${orgConfig.nonprofit.type} nonprofit building community through cycling events, group rides, and fundraising in ${orgConfig.location}.`,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? `https://${orgConfig.domain}`
  ),
  openGraph: {
    type: "website",
    siteName: orgConfig.name,
    locale: "en_US",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let navUser: { email: string; full_name?: string | null } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    navUser = {
      email: user.email!,
      full_name: profile?.full_name,
    };
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <TopNav user={navUser} />
        <main className="flex-1">{children}</main>
        <Footer />
        <MilesChat />
      </body>
    </html>
  );
}
