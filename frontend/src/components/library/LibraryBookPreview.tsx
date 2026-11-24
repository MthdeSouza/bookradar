import { Heart } from "lucide-react";
import type { LibraryBook } from "@/types/library";
import { READING_STATUS_LABELS } from "@/types/library";

interface LibraryBookPreviewProps {
  book: LibraryBook;
}

export function LibraryBookPreview({ book }: LibraryBookPreviewProps) {
  return (
    <article className="flex items-center gap-3 rounded-3xl border border-border bg-card/40 p-3">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title ? `Capa de ${book.title}` : "Capa do livro"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            Sem capa
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{book.title ?? "Título não informado"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {book.authors.length > 0 ? book.authors.join(", ") : "Autor não informado"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
            {READING_STATUS_LABELS[book.status]}
          </span>
          {book.favorite ? (
            <span className="inline-flex items-center gap-1 text-primary">
              <Heart className="size-3 fill-current" aria-hidden="true" />
              Favorito
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
