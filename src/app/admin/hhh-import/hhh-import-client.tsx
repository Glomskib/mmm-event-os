"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { normalizeRows, TEMPLATE_CSV } from "@/lib/hhh-csv-parse";
import type { NormalizedImportRow, ParseResult } from "@/lib/hhh-csv-parse";
import { importHhhRows, getHhhImportRows } from "./actions";
import type { ImportResult } from "./actions";

// ── CSV download helper ───────────────────────────────────────────────────────

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          if (v == null) return "";
          const s = String(v);
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(",")
    ),
  ];
  return lines.join("\r\n");
}

// ── Column reference ──────────────────────────────────────────────────────────

const COLUMN_DOCS = [
  { col: "email", required: true, note: "email, email_address, customer_email" },
  { col: "name / billing_name", required: false, note: "Customer name (Shopify: Billing Name)" },
  { col: "year", required: false, note: "Defaults to 2025" },
  {
    col: "distance_label / lineitem_name",
    required: false,
    note: 'Text like "100 Mile" — first integer extracted as miles',
  },
  {
    col: "distance_miles / miles",
    required: false,
    note: "Numeric miles (takes priority over label)",
  },
  {
    col: "order_id / order_number",
    required: false,
    note: "For idempotency; synthesised from email+year+miles if absent",
  },
  {
    col: "financial_status / status",
    required: false,
    note: 'Defaults to "paid"; refunded rows excluded from leaderboard',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function HhhImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [exporting, setExporting] = useState(false);

  // ── File parsing ────────────────────────────────────────────────────────────

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a .csv file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large (max 5 MB).");
      return;
    }

    setFileName(file.name);
    setParseResult(null);
    setImportResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const parsed = normalizeRows(results.data);
        setParseResult(parsed);
      },
      error(err) {
        alert(`CSV parse error: ${err.message}`);
      },
    });
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function clearFile() {
    setFileName(null);
    setParseResult(null);
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImport(validRows: NormalizedImportRow[]) {
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importHhhRows(validRows);
      setImportResult(result);
    } finally {
      setImporting(false);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  async function handleExport() {
    setExporting(true);
    try {
      const result = await getHhhImportRows();
      if (!result.ok) {
        alert(result.error ?? "Export failed.");
        return;
      }
      if (result.rows.length === 0) {
        alert("No import records found.");
        return;
      }
      downloadCsv(rowsToCsv(result.rows as unknown as Record<string, unknown>[]), "hhh-imports.csv");
    } finally {
      setExporting(false);
    }
  }

  // ── Template download ────────────────────────────────────────────────────────

  function handleTemplate() {
    downloadCsv(TEMPLATE_CSV, "hhh-import-template.csv");
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Actions row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Upload a Shopify order export or custom CSV to import HHH registrations.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleTemplate}>
            <FileText className="mr-1.5 h-4 w-4" />
            Template CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="mr-1.5 h-4 w-4" />
            {exporting ? "Exporting…" : "Export Imports"}
          </Button>
        </div>
      </div>

      {/* Column reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Accepted Columns</CardTitle>
          <CardDescription className="text-xs">
            Shopify direct exports (Name, Email, Financial Status, Lineitem name, Billing
            Name) are also accepted automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 pb-2 pt-3 font-medium">Column</th>
                  <th className="px-4 pb-2 pt-3 font-medium">Required</th>
                  <th className="px-4 pb-2 pt-3 font-medium">Aliases / Notes</th>
                </tr>
              </thead>
              <tbody>
                {COLUMN_DOCS.map((c) => (
                  <tr key={c.col} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono font-medium">{c.col}</td>
                    <td className="px-4 py-2">
                      {c.required ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Required
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Optional</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{c.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* File upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
        </CardHeader>
        <CardContent>
          {!fileName ? (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drag &amp; drop a CSV, or{" "}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Max 5 MB</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{fileName}</p>
                  {parseResult && (
                    <p className="text-xs text-muted-foreground">
                      {parseResult.totalRows} rows parsed —{" "}
                      <span className="text-green-600">
                        {parseResult.validRows.length} valid
                      </span>
                      {parseResult.invalidRows.length > 0 && (
                        <span className="text-red-600">
                          {" "}
                          · {parseResult.invalidRows.length} invalid
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={clearFile}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview + import */}
      {parseResult && (
        <>
          {/* Invalid rows */}
          {parseResult.invalidRows.length > 0 && (
            <Card className="border-destructive/40">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {parseResult.invalidRows.length} Invalid Row
                  {parseResult.invalidRows.length > 1 ? "s" : ""} (will be skipped)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-4 pb-2 pt-3 font-medium">Row #</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Reason</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Raw data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.invalidRows.map((r) => (
                        <tr key={r.lineNumber} className="border-b last:border-0">
                          <td className="px-4 py-2 text-muted-foreground">
                            {r.lineNumber}
                          </td>
                          <td className="px-4 py-2 text-destructive">{r.reason}</td>
                          <td className="max-w-xs truncate px-4 py-2 text-muted-foreground">
                            {JSON.stringify(r.raw)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview table */}
          {parseResult.validRows.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">
                      Preview — {parseResult.validRows.length} valid rows
                      {parseResult.validRows.length > 20 && " (showing first 20)"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Review before importing. Re-uploading the same CSV is safe
                      (idempotent upsert).
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleImport(parseResult.validRows)}
                    disabled={importing}
                    size="sm"
                  >
                    {importing
                      ? "Importing…"
                      : `Import ${parseResult.validRows.length} Rows`}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-4 pb-2 pt-3 font-medium">Email</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Name</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Year</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Miles</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Distance</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Order</th>
                        <th className="px-4 pb-2 pt-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.preview.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2">{row.email}</td>
                          <td className="px-4 py-2">
                            {[row.first_name, row.last_name]
                              .filter(Boolean)
                              .join(" ") || <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2">{row.event_year}</td>
                          <td className="px-4 py-2 font-semibold text-primary">
                            {row.miles > 0 ? row.miles : (
                              <span className="font-normal text-amber-600">?</span>
                            )}
                          </td>
                          <td className="max-w-[140px] truncate px-4 py-2 text-muted-foreground">
                            {row.distance_label ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {row.order_name ?? row.order_id.slice(0, 16)}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant={
                                row.financial_status === "paid" ? "outline" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {row.financial_status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Import results */}
      {importResult && (
        <Card
          className={
            importResult.ok ? "border-green-500/40" : "border-destructive/40"
          }
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {importResult.ok ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {importResult.ok ? "Import Complete" : "Import Failed"}
            </CardTitle>
            {!importResult.ok && (
              <CardDescription className="text-destructive">
                {importResult.error}
                {importResult.requestId && (
                  <span className="ml-2 text-muted-foreground">
                    (ref: {importResult.requestId})
                  </span>
                )}
              </CardDescription>
            )}
          </CardHeader>
          {importResult.ok && (
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox label="Inserted" value={importResult.inserted} color="text-green-600" />
                <StatBox label="Updated" value={importResult.updated} color="text-blue-600" />
                <StatBox label="Matched to Profile" value={importResult.matched} color="text-primary" />
                <StatBox label="Unmatched" value={importResult.unmatched} color="text-muted-foreground" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Unmatched riders will appear on the leaderboard by name/email and will be
                automatically linked when they create an account with the same email.
              </p>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
