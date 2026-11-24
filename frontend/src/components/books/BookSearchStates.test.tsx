import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchEmptyState, SearchErrorState, SearchIdleState, SearchLoadingState } from "./BookSearchStates";

describe("BookSearchStates", () => {
  it("exibe estado inicial de pesquisa", () => {
    render(<SearchIdleState />);
    expect(screen.getByText("Pesquise por livros")).toBeInTheDocument();
  });

  it("exibe estado de carregamento", () => {
    render(<SearchLoadingState />);
    expect(screen.getByText("Buscando livros")).toBeInTheDocument();
  });

  it("exibe estado de erro com mensagem", () => {
    render(<SearchErrorState message="Falha ao buscar." />);
    expect(screen.getByText("Não foi possível carregar os resultados")).toBeInTheDocument();
    expect(screen.getByText("Falha ao buscar.")).toBeInTheDocument();
  });

  it("exibe estado de resultados vazios com o termo pesquisado", () => {
    render(<SearchEmptyState query="termo-x" />);
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();
    expect(screen.getByText(/termo-x/)).toBeInTheDocument();
  });
});
