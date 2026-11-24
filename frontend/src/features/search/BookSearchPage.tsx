import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BookCard } from "@/components/books/BookCard";
import { BookSearchPagination } from "@/components/books/BookSearchPagination";
import {
  SearchEmptyState,
  SearchErrorState,
  SearchIdleState,
  SearchLoadingState,
} from "@/components/books/BookSearchStates";
import { Button } from "@/components/ui/button";
import { useBookSearch } from "@/hooks/useBookSearch";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const RESULTS_PER_PAGE = 10;

export function BookSearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(inputValue, 400);
  const normalizedQuery = debouncedQuery.trim();

  useEffect(() => {
    setPage(1);
  }, [normalizedQuery]);

  const {
    data,
    error,
    isError,
    isFetching,
    isPending,
  } = useBookSearch({
    query: normalizedQuery,
    page,
    perPage: RESULTS_PER_PAGE,
  });

  const hasQuery = normalizedQuery.length > 0;
  const books = data?.books ?? [];
  const showLoading = hasQuery && (isPending || (isFetching && !data));
  const showError = hasQuery && isError;
  const showEmpty = hasQuery && !showLoading && !showError && !!data && books.length === 0;
  const showResults = hasQuery && !showLoading && !showError && books.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 text-left sm:px-6 lg:px-8">
      <header className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">BookRadar</p>
          <h1 className="m-0 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Descubra livros
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Pesquise por título, autor ou termo livre usando o catálogo integrado à API do BookRadar.
          </p>
        </div>

        <form
          className="flex flex-col gap-3 rounded-3xl border border-border bg-card/60 p-3 shadow-sm sm:flex-row sm:items-center"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <label htmlFor="book-search" className="sr-only">
            Pesquisar livros
          </label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="book-search"
              type="search"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Busque por título, autor ou assunto..."
              autoComplete="off"
              className="h-10 w-full rounded-4xl border border-input bg-background pr-4 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
            />
          </div>
          {inputValue ? (
            <Button type="button" variant="outline" onClick={() => setInputValue("")}>Limpar</Button>
          ) : null}
        </form>
      </header>

      {!hasQuery ? <SearchIdleState /> : null}
      {showLoading ? <SearchLoadingState /> : null}
      {showError ? (
        <SearchErrorState
          message={error instanceof Error ? error.message : "Não foi possível concluir a pesquisa."}
        />
      ) : null}
      {showEmpty ? <SearchEmptyState query={normalizedQuery} /> : null}

      {showResults && data ? (
        <section className="flex flex-col gap-4" aria-label="Resultados da pesquisa">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="m-0 text-xl font-medium text-foreground">Resultados</h2>
              <p className="text-sm text-muted-foreground">
                Exibindo resultados para <span className="font-medium text-foreground">"{data.query}"</span>
                {isFetching ? " (atualizando...)" : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {books.map((book, index) => (
              <BookCard key={`${book.key ?? "book"}-${index}-${page}`} book={book} />
            ))}
          </div>

          <BookSearchPagination
            pagination={data.pagination}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        </section>
      ) : null}
    </div>
  );
}
