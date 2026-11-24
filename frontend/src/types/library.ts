import type { Book } from "@/types/book";

export type ReadingStatus = "quero_ler" | "lendo" | "lido";

export interface LibraryBook {
  key: string;
  title: string | null;
  authors: string[];
  first_publish_year: number | null;
  cover_url: string | null;
  favorite: boolean;
  status: ReadingStatus;
  rating: number | null;
  note: string;
}

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  quero_ler: "Quero ler",
  lendo: "Lendo",
  lido: "Lido",
};

export function toLibraryBook(book: Book): LibraryBook | null {
  if (!book.key) return null;

  return {
    key: book.key,
    title: book.title ?? null,
    authors: Array.isArray(book.authors) ? book.authors.filter((a): a is string => typeof a === "string") : [],
    first_publish_year: typeof book.first_publish_year === "number" ? book.first_publish_year : null,
    cover_url: typeof book.cover_url === "string" ? book.cover_url : null,
    favorite: false,
    status: "quero_ler",
    rating: null,
    note: "",
  };
}
