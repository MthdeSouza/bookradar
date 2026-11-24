import { describe, expect, it } from "vitest";
import { getLibraryStorageKey, loadLibrary, saveLibrary } from "./libraryStorage";

const KEY = getLibraryStorageKey();

const validBook = {
  key: "/works/OL1W",
  title: "Livro",
  authors: ["Autora"],
  first_publish_year: 2000,
  cover_url: "https://covers.openlibrary.org/b/id/1-M.jpg",
  favorite: false,
  status: "quero_ler",
  rating: null,
  note: "",
};

describe("libraryStorage", () => {
  it("retorna lista vazia quando não há dados", () => {
    expect(loadLibrary()).toEqual([]);
  });

  it("persiste e recupera livros válidos", () => {
    saveLibrary([validBook as never]);
    expect(loadLibrary()).toEqual([validBook]);
  });

  it("remove duplicados por key e normaliza armazenamento", () => {
    localStorage.setItem(KEY, JSON.stringify([validBook, { ...validBook, title: "Duplicado" }]));
    const loaded = loadLibrary();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].key).toBe("/works/OL1W");
    expect(JSON.parse(localStorage.getItem(KEY) ?? "[]")).toHaveLength(1);
  });

  it("descarta itens inválidos e mantém os válidos", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([validBook, { title: "sem key" }, "invalido", { key: "", title: "key vazia" }]),
    );
    const loaded = loadLibrary();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].key).toBe("/works/OL1W");
  });

  it("trata JSON inválido/corrompido retornando lista vazia", () => {
    localStorage.setItem(KEY, "{corrompido");
    expect(loadLibrary()).toEqual([]);
  });

  it("normaliza dados inválidos de campos pessoais", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify([
        {
          ...validBook,
          status: "invalido",
          rating: 99,
          favorite: "sim",
          note: 123,
          authors: ["ok", 1],
        },
      ]),
    );
    const [book] = loadLibrary();
    expect(book.status).toBe("quero_ler");
    expect(book.rating).toBeNull();
    expect(book.favorite).toBe(false);
    expect(book.note).toBe("");
    expect(book.authors).toEqual(["ok"]);
  });
});
