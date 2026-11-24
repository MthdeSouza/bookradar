import { BookCard } from "@/components/books/BookCard";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/hooks/useLibrary";
import {
  READING_STATUS_LABELS,
  type LibraryBook,
  type ReadingStatus,
} from "@/types/library";
import { cn } from "cn";
import { Heart, Trash2 } from "lucide-react";

interface LibraryBookItemProps {
  book: LibraryBook;
}

const STATUS_OPTIONS = Object.entries(READING_STATUS_LABELS) as [
  ReadingStatus,
  string,
][];
const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function LibraryBookItem({ book }: LibraryBookItemProps) {
  const { removeBook, toggleFavorite, setStatus, setRating, setNote } =
    useLibrary();

  return (
    <BookCard
      book={{
        key: book.key,
        title: book.title,
        authors: book.authors,
        first_publish_year: book.first_publish_year,
        cover_url: book.cover_url,
        cover_id: null,
        edition_count: null,
      }}
      actions={
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-background/40 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={book.favorite ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFavorite(book.key)}
              aria-pressed={book.favorite}
            >
              <Heart
                data-icon="inline-start"
                className={cn(book.favorite && "fill-current")}
              />
              {book.favorite ? "Favorito" : "Favoritar"}
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeBook(book.key)}
            >
              <Trash2 data-icon="inline-start" />
              Remover
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status de leitura
              </span>
              <select
                value={book.status}
                onChange={(event) =>
                  setStatus(book.key, event.target.value as ReadingStatus)
                }
                className="h-10 rounded-3xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Avaliação pessoal
              </span>
              <select
                value={book.rating ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setRating(book.key, value === "" ? null : Number(value));
                }}
                className="h-10 rounded-3xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
              >
                <option value="">Sem avaliação</option>
                {RATING_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? "estrela" : "estrelas"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observação pessoal
            </span>
            <textarea
              value={book.note}
              onChange={(event) => setNote(book.key, event.target.value)}
              rows={3}
              placeholder="Adicione um comentário ou observação sobre este livro..."
              className="w-full resize-y rounded-3xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </label>
        </div>
      }
    />
  );
}
