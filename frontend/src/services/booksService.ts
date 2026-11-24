import { apiRequest } from "@/services/api";
import type { BookSearchResponse } from "@/types/book";

export interface SearchBooksParams {
  q: string;
  page?: number;
  per_page?: number;
}

export async function searchBooks({
  q,
  page = 1,
  per_page = 10,
}: SearchBooksParams): Promise<BookSearchResponse> {
  const params = new URLSearchParams({
    q,
    page: String(page),
    per_page: String(per_page),
  });

  return apiRequest<BookSearchResponse>(`/api/v1/books/search?${params.toString()}`);
}
