import { describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "./api";
import { searchBooks } from "./booksService";

describe("searchBooks", () => {
  it("monta a URL de busca com parâmetros codificados", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ query: "harry potter", pagination: { page: 2, per_page: 5, total_results: 0 }, books: [] });

    await searchBooks({ q: "harry potter", page: 2, per_page: 5 });

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/v1/books/search?q=harry+potter&page=2&per_page=5",
    );
  });
});
