import { LibraryBig } from "lucide-react";
import { LibraryBookItem } from "@/components/library/LibraryBookItem";
import { Card, CardContent } from "@/components/ui/card";
import { useLibrary } from "@/hooks/useLibrary";

export function LibraryPage() {
  const { books } = useLibrary();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 text-left sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">BookRadar</p>
        <h1 className="m-0 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          Minha biblioteca
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Acompanhe seus livros salvos, favoritos, status de leitura, avaliações e observações pessoais.
        </p>
      </header>

      {books.length === 0 ? (
        <Card className="border-dashed bg-card/40 text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <LibraryBig className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-heading text-base font-medium text-foreground">Sua biblioteca está vazia</p>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Pesquise livros e salve seus favoritos para organizar sua leitura, mesmo sem conexão com a API depois.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="flex flex-col gap-4" aria-label="Livros salvos na biblioteca">
          <div className="flex items-center justify-between gap-3">
            <h2 className="m-0 text-xl font-medium text-foreground">Livros salvos</h2>
            <p className="text-sm text-muted-foreground">{books.length} livro(s)</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {books.map((book) => (
              <LibraryBookItem key={book.key} book={book} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
