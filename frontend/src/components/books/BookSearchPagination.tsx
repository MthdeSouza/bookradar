import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/types/book";

interface BookSearchPaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function BookSearchPagination({
  pagination,
  onPageChange,
  isLoading = false,
}: BookSearchPaginationProps) {
  const { page, per_page, total_results } = pagination;
  const totalPages =
    typeof total_results === "number" && total_results >= 0
      ? Math.max(1, Math.ceil(total_results / per_page))
      : null;

  const canGoPrevious = page > 1;
  const canGoNext = totalPages ? page < totalPages : true;

  return (
    <nav
      aria-label="Paginação de resultados"
      className="flex flex-col gap-3 rounded-3xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="text-sm text-muted-foreground">
        <p>
          Página <span className="font-medium text-foreground">{page}</span>
          {totalPages ? (
            <>
              {" "}de <span className="font-medium text-foreground">{totalPages}</span>
            </>
          ) : null}
        </p>
        <p>
          {typeof total_results === "number"
            ? `${total_results.toLocaleString("pt-BR")} resultado(s) encontrado(s)`
            : "Total de resultados indisponível"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious || isLoading}
        >
          <ChevronLeft data-icon="inline-start" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext || isLoading}
        >
          Próxima
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}
