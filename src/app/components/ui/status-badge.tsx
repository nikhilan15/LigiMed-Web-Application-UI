import { Badge } from "./badge";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "warning":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      case "danger":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "info":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  // Auto-detect variant based on status if not provided
  const autoVariant = variant || (() => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("completed") || lowerStatus.includes("delivered") || lowerStatus.includes("approved") || lowerStatus.includes("active")) {
      return "success";
    } else if (lowerStatus.includes("pending") || lowerStatus.includes("processing") || lowerStatus.includes("transit")) {
      return "warning";
    } else if (lowerStatus.includes("cancelled") || lowerStatus.includes("rejected") || lowerStatus.includes("failed") || lowerStatus.includes("expired")) {
      return "danger";
    } else if (lowerStatus.includes("new") || lowerStatus.includes("assigned")) {
      return "info";
    }
    return "default";
  })();

  return (
    <Badge className={getVariantStyles()} variant="secondary">
      {status}
    </Badge>
  );
}
