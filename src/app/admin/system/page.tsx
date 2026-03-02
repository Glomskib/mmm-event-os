import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { LateHealthCheck } from "./late-health-client";

export const metadata = { title: "System Health | Admin | MMM Event OS" };

const REQUIRED_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_FROM",
  "MMM_ADMIN_EMAIL",
  "WELCOME_EMAIL_ENABLED",
  "LATE_API_KEY",
] as const;

export default async function SystemHealthPage() {
  const org = await getCurrentOrg();
  if (!org) {
    return <div className="p-8 text-center text-red-600">Org not found</div>;
  }

  const admin = createAdminClient();

  // Run all queries in parallel
  const [envChecks, connectivityCheck, recentRegistrations, recentLogs] =
    await Promise.all([
      // Env var presence checks (boolean only)
      Promise.resolve(
        REQUIRED_ENV_VARS.map((key) => ({
          key,
          present: !!process.env[key],
        }))
      ),

      // Supabase connectivity
      Promise.resolve(
        admin
          .from("orgs")
          .select("id")
          .limit(1)
      )
        .then(({ error }) => !error)
        .catch(() => false),

      // Last 10 registrations
      admin
        .from("registrations")
        .select("id, participant_name, distance, status, created_at")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(10)
        .then(({ data }) => data ?? []),

      // Last 20 system logs
      admin
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => data ?? []),
    ]);

  const allEnvPresent = envChecks.every((e) => e.present);

  return (
    <>
      <Hero
        title="System Health"
        subtitle="Environment, connectivity, and execution logs"
      />

      <section className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Environment Variables</CardTitle>
            <CardDescription>
              Presence check only — values are never displayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium">Overall:</span>
              {allEnvPresent ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  All Set
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  Missing Vars
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {envChecks.map((env) => (
                <div
                  key={env.key}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <code className="text-xs">{env.key}</code>
                  {env.present ? (
                    <span className="text-green-600 text-sm font-medium">
                      Set
                    </span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">
                      Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Connectivity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supabase Connectivity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  connectivityCheck ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                {connectivityCheck ? "Connected" : "Connection Failed"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Late.dev Connectivity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Late.dev Connectivity</CardTitle>
            <CardDescription>
              Social publishing API — click to check connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LateHealthCheck />
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Registrations</CardTitle>
            <CardDescription>Last 10 registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRegistrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No registrations yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Distance</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRegistrations.map((reg) => (
                      <tr key={reg.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">
                          {reg.participant_name ?? "—"}
                        </td>
                        <td className="py-2 pr-4">{reg.distance}</td>
                        <td className="py-2 pr-4">
                          <StatusBadge status={reg.status} />
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(reg.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
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

        {/* System Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Logs</CardTitle>
            <CardDescription>
              Recent cron and system execution logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No logs yet. Logs will appear after cron jobs run.
              </p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border px-3 py-2"
                  >
                    <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">
                      {log.type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{log.message}</p>
                      {log.meta &&
                        typeof log.meta === "object" &&
                        Object.keys(log.meta).length > 0 && (
                          <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}

