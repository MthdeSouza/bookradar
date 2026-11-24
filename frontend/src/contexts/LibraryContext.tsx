import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadLibrary, saveLibrary } from "@/services/libraryStorage";
import type { Book } from "@/types/book";
import { toLibraryBook, type LibraryBook, type ReadingStatus } from "@/types/library";

export interface FeedbackMessage {
  type: "success" | "error" | "info";
  text: string;
}

interface LibraryContextValue {
  books: LibraryBook[];
  feedback: FeedbackMessage | null;
  clearFeedback: () => void;
  isInLibrary: (key: string) => boolean;
  getBook: (key: string) => LibraryBook | undefined;
  addBook: (book: Book) => boolean;
  removeBook: (key: string) => void;
  toggleFavorite: (key: string) => void;
  setStatus: (key: string, status: ReadingStatus) => void;
  setRating: (key: string, rating: number | null) => void;
  setNote: (key: string, note: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function persist(updater: (prev: LibraryBook[]) => LibraryBook[]) {
  return (prev: LibraryBook[]) => {
    const next = updater(prev);
    saveLibrary(next);
    return next;
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<LibraryBook[]>(() => loadLibrary());
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const pushFeedback = useCallback((message: FeedbackMessage) => {
    setFeedback(message);
  }, []);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  const isInLibrary = useCallback(
    (key: string) => books.some((book) => book.key === key),
    [books],
  );

  const getBook = useCallback(
    (key: string) => books.find((book) => book.key === key),
    [books],
  );

  const addBook = useCallback(
    (book: Book) => {
      if (!book.key) {
        pushFeedback({ type: "error", text: "Não foi possível salvar este livro (identificador ausente)." });
        return false;
      }

      let added = false;
      setBooks(
        persist((prev) => {
          if (prev.some((item) => item.key === book.key)) {
            return prev;
          }
          const libraryBook = toLibraryBook(book);
          if (!libraryBook) return prev;
          added = true;
          return [libraryBook, ...prev];
        }),
      );

      if (added) {
        pushFeedback({ type: "success", text: "Livro adicionado à sua biblioteca." });
      } else {
        pushFeedback({ type: "info", text: "Este livro já está na sua biblioteca." });
      }
      return added;
    },
    [pushFeedback],
  );

  const removeBook = useCallback(
    (key: string) => {
      let removed = false;
      setBooks(
        persist((prev) => {
          if (!prev.some((item) => item.key === key)) return prev;
          removed = true;
          return prev.filter((item) => item.key !== key);
        }),
      );
      if (removed) {
        pushFeedback({ type: "success", text: "Livro removido da sua biblioteca." });
      }
    },
    [pushFeedback],
  );

  const toggleFavorite = useCallback((key: string) => {
    setBooks(
      persist((prev) =>
        prev.map((item) => (item.key === key ? { ...item, favorite: !item.favorite } : item)),
      ),
    );
  }, []);

  const setStatus = useCallback((key: string, status: ReadingStatus) => {
    setBooks(
      persist((prev) => prev.map((item) => (item.key === key ? { ...item, status } : item))),
    );
  }, []);

  const setRating = useCallback((key: string, rating: number | null) => {
    setBooks(
      persist((prev) =>
        prev.map((item) => (item.key === key ? { ...item, rating } : item)),
      ),
    );
  }, []);

  const setNote = useCallback((key: string, note: string) => {
    setBooks(
      persist((prev) => prev.map((item) => (item.key === key ? { ...item, note } : item))),
    );
  }, []);

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      feedback,
      clearFeedback,
      isInLibrary,
      getBook,
      addBook,
      removeBook,
      toggleFavorite,
      setStatus,
      setRating,
      setNote,
    }),
    [
      books,
      feedback,
      clearFeedback,
      isInLibrary,
      getBook,
      addBook,
      removeBook,
      toggleFavorite,
      setStatus,
      setRating,
      setNote,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary deve ser usado dentro de LibraryProvider.");
  }
  return context;
}
