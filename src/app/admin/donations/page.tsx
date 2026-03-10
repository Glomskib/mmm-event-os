import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createUntypedAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Donations | Admin" };

export default async function AdminDonationsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const { data: donations } = await db
    .from("donations")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const rows = donations ?? [];
  const totalCents = rows.reduce(
    (sum: number, d: { amount: number }) => sum + d.amount,
    0
  );
  const totalFormatted = `$${(totalCents / 100).toFixed(2)}`;

  return (
    <>
      <Hero title="Donations" subtitle="Track donations and total raised" />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Total raised stat */}
        <div className="mb-8 rounded-lg border bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Total Raised
          </p>
          <p className="text-4xl font-bold text-green-600">{totalFormatted}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} donation{rows.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Donations table */}
        {rows.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No donations yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs font-medium uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Donor Email</th>
                  <th className="px-4 py-3">Donor Name</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Stripe Session ID</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(
                  (d: {
                    id: string;
                    created_at: string;
                    donor_email: string | null;
                    donor_name: string | null;
                    amount: number;
                    stripe_session_id: string | null;
                  }) => (
                    <tr key={d.id} className="hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(d.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">{d.donor_email ?? "—"}</td>
                      <td className="px-4 py-3">{d.donor_name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                        ${(d.amount / 100).toFixed(2)}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                        {d.stripe_session_id ?? "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
