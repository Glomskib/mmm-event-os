import { requireAdmin } from "@/lib/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces admin role check on all /admin/* pages.
  // Redirects to /login if not authenticated, / if not admin.
  await requireAdmin();

  return <>{children}</>;
}
