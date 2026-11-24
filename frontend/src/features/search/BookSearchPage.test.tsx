import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { BookSearchPage } from "./BookSearchPage";

const useBookSearchMock = vi.fn();

vi.mock("@/hooks/useBookSearch", () => ({
  useBookSearch: (...args: unknown[]) => useBookSearchMock(...args),
}));

const sampleBook = {
  key: "/works/OL1W",
  title: "Livro de Teste",
  authors: ["Autora Teste"],
  first_publish_year: 2020,
  cover_id: 10,
  cover_url: "https://covers.openlibrary.org/b/id/10-M.jpg",
  edition_count: 2,
};

function renderPage() {
  return render(
    <LibraryProvider>
      <BookSearchPage />
    </LibraryProvider>,
  );
}

function typeQuery(value: string) {
  const input = screen.getByLabelText(/pesquisar livros/i);
  fireEvent.change(input, { target: { value } });
  act(() => {
    vi.advanceTimersByTime(400);
  });
}

describe("BookSearchPage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useBookSearchMock.mockReset();
    useBookSearchMock.mockReturnValue({
      data: undefined,
      error: null,
      isError: false,
      isFetching: false,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exibe estado inicial quando não há termo pesquisado", () => {
    renderPage();
    expect(screen.getByText("Pesquise por livros")).toBeInTheDocument();
  });

  it("exibe estado de carregamento durante a busca", () => {
    useBookSearchMock.mockImplementation(({ query }: { query: string }) => {
      if (query === "harry") {
        return { data: undefined, error: null, isError: false, isFetching: true, isPending: true };
      }
      return { data: undefined, error: null, isError: false, isFetching: false, isPending: false };
    });

    renderPage();
    typeQuery("harry");

    expect(screen.getByText("Buscando livros")).toBeInTheDocument();
  });

  it("exibe estado de erro quando a busca falha", () => {
    useBookSearchMock.mockImplementation(({ query }: { query: string }) => {
      if (query === "harry") {
        return {
          data: undefined,
          error: new Error("Falha externa"),
          isError: true,
          isFetching: false,
          isPending: false,
        };
      }
      return { data: undefined, error: null, isError: false, isFetching: false, isPending: false };
    });

    renderPage();
    typeQuery("harry");

    expect(screen.getByText("Não foi possível carregar os resultados")).toBeInTheDocument();
    expect(screen.getByText("Falha externa")).toBeInTheDocument();
  });

  it("exibe resultados vazios quando a API não retorna livros", () => {
    useBookSearchMock.mockImplementation(({ query }: { query: string }) => {
      if (query === "harry") {
        return {
          data: { query: "harry", pagination: { page: 1, per_page: 10, total_results: 0 }, books: [] },
          error: null,
          isError: false,
          isFetching: false,
          isPending: false,
        };
      }
      return { data: undefined, error: null, isError: false, isFetching: false, isPending: false };
    });

    renderPage();
    typeQuery("harry");

    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
  });

  it("permite adicionar e remover livros da biblioteca a partir dos resultados", () => {
    useBookSearchMock.mockImplementation(({ query }: { query: string }) => {
      if (query === "harry") {
        return {
          data: {
            query: "harry",
            pagination: { page: 1, per_page: 10, total_results: 1 },
            books: [sampleBook],
          },
          error: null,
          isError: false,
          isFetching: false,
          isPending: false,
        };
      }
      return { data: undefined, error: null, isError: false, isFetching: false, isPending: false };
    });

    renderPage();
    typeQuery("harry");

    expect(screen.getByText("Livro de Teste")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /salvar na biblioteca/i }));
    expect(screen.getByText("Na biblioteca")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bookradar.library.v1") ?? "[]")).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /^remover$/i }));
    expect(screen.getByRole("button", { name: /salvar na biblioteca/i })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("bookradar.library.v1") ?? "[]")).toHaveLength(0);
  });
});
