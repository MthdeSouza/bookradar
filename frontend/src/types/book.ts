export interface Book {
  key: string | null;
  title: string | null;
  authors: string[];
  first_publish_year: number | null;
  cover_id: number | null;
  cover_url: string | null;
  edition_count: number | null;
}

export interface Pagination {
  page: number;
  per_page: number;
  total_results: number | null;
}

export interface BookSearchResponse {
  query: string;
  pagination: Pagination;
  books: Book[];
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}
