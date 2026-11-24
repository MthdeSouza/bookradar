import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LibraryBookPreview } from "@/components/library/LibraryBookPreview";
import type { LibraryBook } from "@/types/library";

interface LibraryDashboardSectionProps {
  title: string;
  description?: string;
  books: LibraryBook[];
  emptyMessage: string;
  icon?: ReactNode;
}

export function LibraryDashboardSection({
  title,
  description,
  books,
  emptyMessage,
  icon,
}: LibraryDashboardSectionProps) {
  return (
    <Card className="bg-card/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-primary">{icon}</span> : null}
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {books.map((book) => (
              <LibraryBookPreview key={book.key} book={book} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
