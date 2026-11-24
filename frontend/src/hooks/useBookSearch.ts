import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchBooks } from "@/services/booksService";
import type { BookSearchResponse } from "@/types/book";

interface UseBookSearchParams {
  query: string;
  page: number;
  perPage?: number;
}

export function useBookSearch({ query, page, perPage = 10 }: UseBookSearchParams) {
  const trimmedQuery = query.trim();

  return useQuery<BookSearchResponse>({
    queryKey: ["books", "search", { q: trimmedQuery, page, perPage }],
    queryFn: () => searchBooks({ q: trimmedQuery, page, per_page: perPage }),
    enabled: trimmedQuery.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
