import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { BookDisplay } from "@/types/book";
import { cn } from "cn";

interface BookCardProps {
  book: BookDisplay;
  className?: string;
  actions?: ReactNode;
}

export function BookCard({ book, className, actions }: BookCardProps) {
  const authors = book.authors.length > 0 ? book.authors.join(", ") : "Autor desconhecido";
  const year = book.first_publish_year ? String(book.first_publish_year) : "Ano não informado";

  return (
    <Card className={cn("h-full overflow-hidden text-left", className)} size="sm">
      <div className="flex h-full flex-col sm:flex-row">
        <div className="border-b border-border bg-muted/30 p-4 sm:w-40 sm:shrink-0 sm:border-r sm:border-b-0">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title ? `Capa de ${book.title}` : "Capa do livro"}
              loading="lazy"
              className="mx-auto aspect-[2/3] w-28 rounded-xl object-cover shadow-sm sm:w-full"
            />
          ) : (
            <div
              aria-label="Livro sem capa"
              className="mx-auto flex aspect-[2/3] w-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/60 p-3 text-center text-muted-foreground sm:w-full"
            >
              <BookOpen className="size-8" aria-hidden="true" />
              <span className="text-xs font-medium">Sem capa</span>
            </div>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col justify-center gap-3 py-4">
          <div className="space-y-1">
            <h2 className="font-heading text-base font-medium leading-snug text-foreground">
              {book.title || "Título não informado"}
            </h2>
            <p className="text-sm text-muted-foreground">{authors}</p>
          </div>

          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ano</dt>
              <dd className="font-medium text-foreground">{year}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Edições</dt>
              <dd className="font-medium text-foreground">
                {book.edition_count ?? "Não informado"}
              </dd>
            </div>
          </dl>

          {actions ? <div className="pt-1">{actions}</div> : null}
        </CardContent>
      </div>
    </Card>
  );
}
