import type { LibraryBook, ReadingStatus } from "@/types/library";

const STORAGE_KEY = "bookradar.library.v1";
const VALID_STATUSES: ReadingStatus[] = ["quero_ler", "lendo", "lido"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeRating(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 5) return null;
  return num;
}

function sanitizeStatus(value: unknown): ReadingStatus {
  return VALID_STATUSES.includes(value as ReadingStatus) ? (value as ReadingStatus) : "quero_ler";
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function sanitizeLibraryBook(value: unknown): LibraryBook | null {
  if (!isRecord(value)) return null;
  if (typeof value.key !== "string" || value.key.trim().length === 0) return null;

  return {
    key: value.key,
    title: typeof value.title === "string" ? value.title : null,
    authors: sanitizeStringArray(value.authors),
    first_publish_year:
      typeof value.first_publish_year === "number" && Number.isFinite(value.first_publish_year)
        ? value.first_publish_year
        : null,
    cover_url: typeof value.cover_url === "string" ? value.cover_url : null,
    favorite: value.favorite === true,
    status: sanitizeStatus(value.status),
    rating: sanitizeRating(value.rating),
    note: typeof value.note === "string" ? value.note : "",
  };
}

function writeBooks(books: LibraryBook[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch {
    // Ignora falhas de escrita (ex.: armazenamento indisponível/cheio) sem quebrar a UI.
  }
}

export function loadLibrary(): LibraryBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      writeBooks([]);
      return [];
    }

    const seen = new Set<string>();
    const books: LibraryBook[] = [];
    for (const item of parsed) {
      const sanitized = sanitizeLibraryBook(item);
      if (!sanitized || seen.has(sanitized.key)) continue;
      seen.add(sanitized.key);
      books.push(sanitized);
    }

    // Normaliza o armazenamento caso haja dados inválidos/duplicados.
    if (books.length !== parsed.length) {
      writeBooks(books);
    }

    return books;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora falhas ao limpar dados corrompidos.
    }
    return [];
  }
}

export function saveLibrary(books: LibraryBook[]) {
  writeBooks(books);
}

export function getLibraryStorageKey() {
  return STORAGE_KEY;
}
