"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  CSV Parser — handles quoted fields, newlines inside quotes, etc.  */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field.trim());
        field = "";
      } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
        row.push(field.trim());
        if (row.some((c) => c !== "")) rows.push(row);
        row = [];
        field = "";
        if (ch === "\r") i++; // skip \n after \r
      } else {
        field += ch;
      }
    }
  }
  // last field
  row.push(field.trim());
  if (row.some((c) => c !== "")) rows.push(row);

  return rows;
}

/* ------------------------------------------------------------------ */
/*  Column mapping helpers                                            */
/* ------------------------------------------------------------------ */

type MappableField = "email" | "first_name" | "last_name" | "tags" | "skip";

const FIELD_OPTIONS: { value: MappableField; label: string }[] = [
  { value: "skip", label: "-- Skip --" },
  { value: "email", label: "Email" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "tags", label: "Tags" },
];

function autoDetectMapping(header: string): MappableField {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (h === "email" || h === "emailaddress") return "email";
  if (h === "firstname" || h === "first") return "first_name";
  if (h === "lastname" || h === "last") return "last_name";
  if (h === "tags" || h === "tag") return "tags";
  return "skip";
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type ImportResult = {
  imported: number;
  updated: number;
  errors: string[];
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ImportForm() {
  const fileRef = useRef<HTMLInputElement>(null);

  // CSV state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<MappableField[]>([]);

  // Form fields
  const [source, setSource] = useState("shopify_import");
  const [globalTags, setGlobalTags] = useState("");

  // Import state
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* --- File handling --- */

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        setError("CSV must have a header row and at least one data row.");
        return;
      }

      const hdrs = parsed[0];
      setHeaders(hdrs);
      setRows(parsed.slice(1));
      setMapping(hdrs.map(autoDetectMapping));
    };
    reader.readAsText(file);
  }, []);

  /* --- Build subscribers from parsed data --- */

  const buildSubscribers = useCallback(() => {
    const emailIdx = mapping.indexOf("email");
    if (emailIdx === -1) return null;

    const firstIdx = mapping.indexOf("first_name");
    const lastIdx = mapping.indexOf("last_name");
    const tagsIdx = mapping.indexOf("tags");

    const extraTags = globalTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const subs: { email: string; name?: string; tags: string[] }[] = [];

    for (const row of rows) {
      const email = row[emailIdx]?.toLowerCase().trim();
      if (!email || !email.includes("@")) continue;

      const first = firstIdx >= 0 ? row[firstIdx]?.trim() : "";
      const last = lastIdx >= 0 ? row[lastIdx]?.trim() : "";
      const name = [first, last].filter(Boolean).join(" ") || undefined;

      const rowTags: string[] = [];
      if (tagsIdx >= 0 && row[tagsIdx]) {
        rowTags.push(
          ...row[tagsIdx]
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        );
      }
      rowTags.push(...extraTags);

      subs.push({ email, name, tags: rowTags });
    }

    return subs;
  }, [mapping, rows, globalTags]);

  /* --- Import --- */

  const handleImport = useCallback(async () => {
    setError(null);
    setResult(null);

    const subscribers = buildSubscribers();
    if (!subscribers || subscribers.length === 0) {
      setError("No valid subscribers found. Make sure the Email column is mapped.");
      return;
    }

    setImporting(true);
    setProgress(0);

    // Send in batches of 100 for progress feedback
    const batchSize = 100;
    const batches = [];
    for (let i = 0; i < subscribers.length; i += batchSize) {
      batches.push(subscribers.slice(i, i + batchSize));
    }

    let totalImported = 0;
    let totalUpdated = 0;
    const allErrors: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      try {
        const res = await fetch("/api/admin/subscribers/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscribers: batches[i], source }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          allErrors.push(body.error || `Batch ${i + 1} failed (${res.status})`);
        } else {
          const data: ImportResult = await res.json();
          totalImported += data.imported;
          totalUpdated += data.updated;
          allErrors.push(...data.errors);
        }
      } catch (err) {
        allErrors.push(`Batch ${i + 1} network error: ${String(err)}`);
      }

      setProgress(Math.round(((i + 1) / batches.length) * 100));
    }

    setResult({ imported: totalImported, updated: totalUpdated, errors: allErrors });
    setImporting(false);
  }, [buildSubscribers, source]);

  /* --- Derived --- */

  const emailMapped = mapping.includes("email");
  const previewRows = rows.slice(0, 5);
  const totalValid = rows.filter((row) => {
    const emailIdx = mapping.indexOf("email");
    if (emailIdx < 0) return false;
    const email = row[emailIdx]?.toLowerCase().trim();
    return email && email.includes("@");
  }).length;

  /* --- Render --- */

  return (
    <div className="space-y-6">
      {/* File upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-5 w-5" /> Upload CSV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFile}
            className="max-w-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Upload a Shopify customer export or any CSV with an email column.
          </p>
        </CardContent>
      </Card>

      {/* Column mapping */}
      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Column Mapping</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {headers.map((h, i) => (
                <div key={i}>
                  <Label className="mb-1 block text-xs text-muted-foreground">
                    {h}
                  </Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mapping[i]}
                    onChange={(e) => {
                      const next = [...mapping];
                      next[i] = e.target.value as MappableField;
                      setMapping(next);
                    }}
                  >
                    {FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {!emailMapped && (
              <p className="mt-3 text-sm font-medium text-destructive">
                Please map at least one column to &quot;Email&quot;.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-5 w-5" /> Preview (first 5 rows)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    {headers.map((h, i) => (
                      <th key={i} className="pb-2 pr-4">
                        {h}
                        {mapping[i] !== "skip" && (
                          <span className="ml-1 text-primary">
                            ({FIELD_OPTIONS.find((o) => o.value === mapping[i])?.label})
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previewRows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className={`py-2 pr-4 ${
                            mapping[ci] === "skip"
                              ? "text-muted-foreground/50"
                              : ""
                          }`}
                        >
                          {cell || "\u2014"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {totalValid} valid emails found out of {rows.length} rows.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Import options */}
      {headers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. shopify_import"
                className="mt-1 max-w-sm"
              />
            </div>
            <div>
              <Label htmlFor="tags">
                Tags <span className="text-muted-foreground">(comma-separated, applied to all)</span>
              </Label>
              <Input
                id="tags"
                value={globalTags}
                onChange={(e) => setGlobalTags(e.target.value)}
                placeholder="e.g. shopify, newsletter"
                className="mt-1 max-w-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress bar */}
      {importing && (
        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Importing... {progress}%
          </p>
        </div>
      )}

      {/* Result summary */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {result.errors.length === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>{result.imported}</strong> new subscribers imported
            </p>
            <p>
              <strong>{result.updated}</strong> existing subscribers updated
            </p>
            {result.errors.length > 0 && (
              <div>
                <p className="font-medium text-destructive">
                  {result.errors.length} error(s):
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-destructive">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 20 && (
                    <li>...and {result.errors.length - 20} more</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      {/* Import button */}
      {headers.length > 0 && (
        <Button
          onClick={handleImport}
          disabled={!emailMapped || importing || totalValid === 0}
          size="lg"
        >
          {importing
            ? "Importing..."
            : `Import ${totalValid} Subscriber${totalValid !== 1 ? "s" : ""}`}
        </Button>
      )}
    </div>
  );
}
