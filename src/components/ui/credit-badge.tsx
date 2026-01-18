import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CreditBadgeProps {
  role: string;
  name: string | null;
  username: string | null;
  invitedEmail: string | null;
}

export function CreditBadge({
  role,
  name,
  username,
  invitedEmail,
}: CreditBadgeProps) {
  const displayName = name || invitedEmail || "Unknown";

  if (username) {
    return (
      <Link href={`/u/${username}`}>
        <Badge
          variant="outline"
          className="cursor-pointer transition-colors hover:border-accent hover:text-accent"
        >
          <span className="font-medium">{role}:</span>{" "}
          <span className="ml-1">{displayName}</span>
        </Badge>
      </Link>
    );
  }

  return (
    <Badge variant="outline">
      <span className="font-medium">{role}:</span>{" "}
      <span className="ml-1">{displayName}</span>
    </Badge>
  );
}






