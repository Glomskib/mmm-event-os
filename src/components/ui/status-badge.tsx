import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  free: "bg-blue-100 text-blue-800 border-blue-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  emergency_flag: "bg-red-100 text-red-800 border-red-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  published: "bg-green-100 text-green-800 border-green-200",
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
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800 border-gray-200",
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
