import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  // Success states — brand green
  paid:      "bg-green-50 text-green-700 border-green-200",
  approved:  "bg-green-50 text-green-700 border-green-200",
  published: "bg-green-50 text-green-700 border-green-200",
  // Informational — brand ice/blue
  free:      "bg-blue-50 text-blue-700 border-blue-200",
  // Warning — brand warning amber
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  draft:     "bg-amber-50 text-amber-700 border-amber-200",
  // Danger — brand danger red
  cancelled:       "bg-red-50 text-red-700 border-red-200",
  emergency_flag:  "bg-red-50 text-red-700 border-red-200",
  // Neutral — muted
  refunded:  "bg-[#D7E3F0] text-[#29475E] border-[#D7E3F0]",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
