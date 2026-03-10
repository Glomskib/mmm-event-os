import { requireAdmin } from "@/lib/require-admin";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { Hero } from "@/components/layout/hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, HandHeart, Users, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Volunteer Management | Admin" };

type VolunteerSignup = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  shirt_size: string | null;
  training_complete: boolean;
  total_hours: number;
  status: string;
  reliability_notes: string | null;
  created_at: string;
};

export default async function VolunteersPage() {
  await requireAdmin();
  const db = createUntypedAdminClient();

  const { data: raw } = await db
    .from("volunteer_signups")
    .select("*")
    .order("created_at", { ascending: false });

  const signups = (raw ?? []) as VolunteerSignup[];

  const activeCount = signups.filter((s) => s.status === "active" || !s.status).length;
  const trainedCount = signups.filter((s) => s.training_complete).length;
  const totalHours = signups.reduce((s, v) => s + (v.total_hours ?? 0), 0);

  return (
    <>
      <Hero title="Volunteer Management" subtitle="Signups, training, and hours tracking" />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Button>
          </Link>
          <Link href="/admin/volunteer-assignments">
            <Button size="sm" variant="outline">Manage Assignments</Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <Users className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-2xl font-bold">{signups.length}</p>
                <p className="text-xs text-muted-foreground">Total Signups</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <HandHeart className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <ShieldCheck className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{trainedCount}</p>
                <p className="text-xs text-muted-foreground">Training Complete</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{totalHours.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Total Hours</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="h-5 w-5" />
              All Volunteers ({signups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No volunteer signups yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Contact</th>
                      <th className="pb-2 pr-3">Emergency Contact</th>
                      <th className="pb-2 pr-3">Shirt</th>
                      <th className="pb-2 pr-3">Training</th>
                      <th className="pb-2 pr-3">Hours</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {signups.map((s) => (
                      <tr key={s.id}>
                        <td className="py-2 pr-3">
                          <span className="font-medium">{s.name}</span>
                          {s.message && (
                            <p className="text-xs text-muted-foreground max-w-xs truncate">{s.message}</p>
                          )}
                          {s.reliability_notes && (
                            <p className="text-xs text-amber-600 max-w-xs truncate">{s.reliability_notes}</p>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          <div>{s.email}</div>
                          {s.phone && <div className="text-xs">{s.phone}</div>}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {s.emergency_contact_name ? (
                            <div>
                              <div>{s.emergency_contact_name}</div>
                              {s.emergency_contact_phone && <div className="text-xs">{s.emergency_contact_phone}</div>}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600">Not provided</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {s.shirt_size ? (
                            <Badge variant="secondary">{s.shirt_size}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {s.training_complete ? (
                            <Badge variant="default">Trained</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 tabular-nums">
                          {s.total_hours > 0 ? `${s.total_hours}h` : "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={s.status === "active" || !s.status ? "default" : "secondary"}>
                            {s.status || "active"}
                          </Badge>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
