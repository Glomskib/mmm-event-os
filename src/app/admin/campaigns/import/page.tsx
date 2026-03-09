import { requireAdmin } from "@/lib/require-admin";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ImportForm } from "./import-form";

export const metadata = { title: "Import Subscribers | Admin" };

export default async function ImportSubscribersPage() {
  await requireAdmin();

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/admin/campaigns/subscribers">
        <Button variant="ghost" size="sm" className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Subscribers
        </Button>
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Import Subscribers</h1>

      <ImportForm />
    </section>
  );
}
