import { Card, CardContent } from "@/components/ui/card";

interface ReservedSlotProps {
  releaseDate?: string;
}

export function ReservedSlot({ releaseDate = "Jan 26" }: ReservedSlotProps) {
  return (
    <Card className="h-full border-border bg-surface opacity-50">
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-background/50">
        <div className="flex h-full items-center justify-center">
          <span className="text-center text-sm text-primary/30">
            Coming Soon
            <br />
            {releaseDate}
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="h-6 w-3/4 rounded-sm bg-background/30" />
        <div className="mt-2 h-4 w-1/2 rounded-sm bg-background/20" />
      </CardContent>
    </Card>
  );
}

