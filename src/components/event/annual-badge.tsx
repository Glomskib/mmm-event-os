function ordinalSuffix(n: number): string {
  const abs = Math.abs(n);
  const teen = abs % 100;
  if (teen >= 11 && teen <= 13) return "th";
  switch (abs % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

interface AnnualBadgeProps {
  /** The calendar year of the event (e.g. 2026). */
  eventYear: number;
  /** Year of the inaugural edition. Defaults to 1974 for HHH. */
  foundingYear?: number;
}

/**
 * Renders an ordinal "Nth Annual" badge.
 * E.g. eventYear=2026, foundingYear=1974 → "53rd Annual"
 */
export function AnnualBadge({
  eventYear,
  foundingYear = 1974,
}: AnnualBadgeProps) {
  const edition = eventYear - foundingYear + 1;
  if (edition < 1) return null;
  const suffix = ordinalSuffix(edition);

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: "var(--brand-orange)", color: "#fff" }}
    >
      {edition}
      {suffix} Annual
    </span>
  );
}
