/**
 * HHH CSV parsing utilities.
 * Pure functions — no server imports, safe for client and server use.
 */

export interface NormalizedImportRow {
  email: string;
  order_id: string;
  order_name: string | null;
  first_name: string | null;
  last_name: string | null;
  distance_label: string | null;
  miles: number;
  event_year: number;
  financial_status: string;
  /** Original CSV row, stored as raw_json for audit */
  raw: Record<string, string>;
}

export interface InvalidRow {
  lineNumber: number;
  reason: string;
  raw: Record<string, string>;
}

export interface ParseResult {
  totalRows: number;
  validRows: NormalizedImportRow[];
  invalidRows: InvalidRow[];
  preview: NormalizedImportRow[];
}

// ── Column alias tables ───────────────────────────────────────────────────────

const EMAIL_ALIASES = ["email", "email_address", "customer_email"];

// Customer display name (not order number)
const NAME_ALIASES = [
  "billing_name",
  "billing name",
  "full_name",
  "full name",
  "customer_name",
  "customer name",
];

// Shopify "Name" column is the order name (#1001)
const ORDER_NAME_ALIASES = ["name", "order_name", "order_number"];

// Explicit order ID columns
const ORDER_ID_ALIASES = ["order_id", "id"];

// Distance columns (numeric first, then text-extract)
const DISTANCE_NUMERIC_ALIASES = ["distance_miles", "miles"];
const DISTANCE_TEXT_ALIASES = [
  "distance_label",
  "distance",
  "variant",
  "lineitem_name",
  "lineitem name",
  "line_item_name",
];

const STATUS_ALIASES = [
  "financial_status",
  "financial status",
  "payment_status",
  "status",
];

const YEAR_ALIASES = ["year", "event_year"];

// ── Header normalisation ──────────────────────────────────────────────────────

function normKey(s: string) {
  return s.toLowerCase().trim();
}

/** Build a normalised header → original-header lookup. */
function buildHeaderMap(headers: string[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const h of headers) {
    m.set(normKey(h), h);
  }
  return m;
}

/**
 * Return the first matching header value from a row, given a list of aliases.
 * Aliases are compared case-insensitively with spaces/underscores normalised.
 */
function pick(
  row: Record<string, string>,
  headerMap: Map<string, string>,
  aliases: string[]
): string | undefined {
  for (const alias of aliases) {
    const orig = headerMap.get(normKey(alias));
    if (orig !== undefined) {
      const val = row[orig];
      if (val !== undefined && val.trim() !== "") return val.trim();
    }
  }
  return undefined;
}

// ── Mile extraction ───────────────────────────────────────────────────────────

export function extractMiles(s: string): number {
  if (!s) return 0;
  const m = s.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// ── Name splitting ────────────────────────────────────────────────────────────

function splitName(full: string): { first: string | null; last: string | null } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return { first: null, last: null };
  const first = parts[0] || null;
  const last = parts.length > 1 ? parts.slice(1).join(" ") : null;
  return { first, last };
}

// ── Stable order-id synthesis ─────────────────────────────────────────────────

function synthesizeOrderId(
  email: string,
  year: number,
  miles: number,
  name: string | null
): string {
  // Deterministic without needing crypto — just concatenate key fields
  const parts = [email.toLowerCase(), String(year), String(miles), name ?? ""].join(
    "|"
  );
  return `manual:${parts}`;
}

// ── Main normalisation ────────────────────────────────────────────────────────

export function normalizeRows(
  data: Record<string, string>[],
  defaultYear = 2025
): ParseResult {
  const validRows: NormalizedImportRow[] = [];
  const invalidRows: InvalidRow[] = [];

  for (let i = 0; i < data.length; i++) {
    const raw = data[i];
    const lineNumber = i + 2; // +1 for 0-index, +1 for header row
    const headers = Object.keys(raw);
    const headerMap = buildHeaderMap(headers);

    // ── Email (required) ──────────────────────────────────────────────────────
    const rawEmail = pick(raw, headerMap, EMAIL_ALIASES);
    if (!rawEmail) {
      invalidRows.push({ lineNumber, reason: "Missing email", raw });
      continue;
    }
    const email = rawEmail.toLowerCase().trim();

    // ── Year ──────────────────────────────────────────────────────────────────
    const yearStr = pick(raw, headerMap, YEAR_ALIASES);
    const event_year = yearStr ? parseInt(yearStr, 10) || defaultYear : defaultYear;

    // ── Miles ─────────────────────────────────────────────────────────────────
    let miles = 0;
    const numericDist = pick(raw, headerMap, DISTANCE_NUMERIC_ALIASES);
    if (numericDist) {
      miles = parseInt(numericDist, 10) || 0;
    } else {
      const textDist = pick(raw, headerMap, DISTANCE_TEXT_ALIASES);
      if (textDist) miles = extractMiles(textDist);
    }

    // ── Distance label (for display/audit) ────────────────────────────────────
    const distance_label =
      pick(raw, headerMap, DISTANCE_TEXT_ALIASES) ??
      (numericDist ? `${miles} mi` : null);

    // ── Customer name ─────────────────────────────────────────────────────────
    let displayName: string | null = pick(raw, headerMap, NAME_ALIASES) ?? null;

    // ── Order name (Shopify "Name" = #1001) ───────────────────────────────────
    let order_name: string | null = null;
    const nameColVal = pick(raw, headerMap, ORDER_NAME_ALIASES);
    if (nameColVal) {
      if (/^#?\d+$/.test(nameColVal.trim())) {
        // Looks like an order number
        order_name = nameColVal.trim();
      } else if (!displayName) {
        // Treat as display name if no dedicated name column found
        displayName = nameColVal;
      }
    }

    const { first: first_name, last: last_name } = splitName(displayName ?? "");

    // ── Order ID ─────────────────────────────────────────────────────────────
    const explicitId = pick(raw, headerMap, ORDER_ID_ALIASES);
    const order_id =
      explicitId ??
      (order_name ? order_name : synthesizeOrderId(email, event_year, miles, displayName));

    // ── Financial status ─────────────────────────────────────────────────────
    const financial_status =
      (pick(raw, headerMap, STATUS_ALIASES) ?? "paid").toLowerCase().trim();

    validRows.push({
      email,
      order_id,
      order_name,
      first_name,
      last_name,
      distance_label,
      miles,
      event_year,
      financial_status,
      raw,
    });
  }

  return {
    totalRows: data.length,
    validRows,
    invalidRows,
    preview: validRows.slice(0, 20),
  };
}

// ── Template CSV ──────────────────────────────────────────────────────────────

export const TEMPLATE_CSV = [
  "email,name,year,distance_label,order_id",
  "rider@example.com,Jane Doe,2025,100 Mile,#1001",
  "rider2@example.com,John Smith,2025,62 Mile,#1002",
  "rider3@example.com,Alex Johnson,2025,25 Mile,#1003",
].join("\r\n");

/** Columns accepted from a Shopify order export */
export const SHOPIFY_COLUMNS_NOTE = `Shopify direct export columns also accepted:
  "Name" (order #), "Email", "Financial Status", "Lineitem name", "Billing Name"`;
