import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LibraryStatCardProps {
  label: string;
  value: number;
  icon?: ReactNode;
  description?: string;
}

export function LibraryStatCard({ label, value, icon, description }: LibraryStatCardProps) {
  return (
    <Card className="bg-card/50">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold leading-none text-foreground">{value}</p>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
