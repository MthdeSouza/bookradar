import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LibraryProvider } from "@/contexts/LibraryContext";
import { LibraryPage } from "./LibraryPage";

const STORAGE_KEY = "bookradar.library.v1";

const storedBook = {
  key: "/works/OL1W",
  title: "Livro Salvo",
  authors: ["Autora"],
  first_publish_year: 2010,
  cover_url: null,
  favorite: false,
  status: "quero_ler",
  rating: null,
  note: "",
};

function seed(books: unknown[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function renderLibrary() {
  return render(
    <LibraryProvider>
      <LibraryPage />
    </LibraryProvider>,
  );
}

describe("Biblioteca pessoal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("recupera livros persistidos e exibe no dashboard/biblioteca", () => {
    seed([storedBook]);
    renderLibrary();
    expect(screen.getAllByText("Livro Salvo").length).toBeGreaterThan(0);
    expect(screen.getByText("Total salvos")).toBeInTheDocument();
    expect(screen.getByText("1 de 1 livro(s)")).toBeInTheDocument();
  });

  it("altera status de leitura diretamente na biblioteca e persiste", async () => {
    seed([storedBook]);
    renderLibrary();
    const user = userEvent.setup();

    const statusSelect = screen.getByLabelText("Status de leitura");
    await user.selectOptions(statusSelect, "lendo");

    expect(statusSelect).toHaveValue("lendo");
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(saved[0].status).toBe("lendo");
  });

  it("marca favorito e persiste", async () => {
    seed([storedBook]);
    renderLibrary();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /favoritar/i }));
    expect(screen.getByRole("button", { name: /favorito/i })).toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(saved[0].favorite).toBe(true);
  });

  it("remove livro e persiste", async () => {
    seed([storedBook]);
    renderLibrary();
    const user = userEvent.setup();

    const removeButtons = screen.getAllByRole("button", { name: /^remover$/i });
    await user.click(removeButtons[0]);

    expect(screen.getByText("Sua biblioteca está vazia")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toHaveLength(0);
  });

  it("evita livros duplicados ao carregar dados persistidos", () => {
    seed([storedBook, { ...storedBook, title: "Duplicado" }]);
    renderLibrary();
    expect(screen.queryByText("Duplicado")).not.toBeInTheDocument();
    expect(screen.getByText("1 de 1 livro(s)")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toHaveLength(1);
  });

  it("filtra por status e pesquisa dentro da biblioteca", async () => {
    seed([
      storedBook,
      { ...storedBook, key: "/works/OL2W", title: "Outro Livro", status: "lido", favorite: true, note: "ótimo" },
    ]);
    renderLibrary();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Filtrar por status"), "lido");
    expect(screen.getAllByText("Outro Livro").length).toBeGreaterThan(0);
    expect(screen.getByText("1 de 2 livro(s)")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Livro Salvo" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por status"), "all");
    await user.type(screen.getByLabelText("Pesquisar na biblioteca"), "ótimo");
    expect(screen.getAllByText("Outro Livro").length).toBeGreaterThan(0);
    expect(screen.getByText("1 de 2 livro(s)")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Livro Salvo" })).not.toBeInTheDocument();
  });
});
