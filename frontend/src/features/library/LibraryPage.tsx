import { LibraryBookItem } from "@/components/library/LibraryBookItem";
import { LibraryDashboardSection } from "@/components/library/LibraryDashboardSection";
import { LibraryStatCard } from "@/components/library/LibraryStatCard";
import { Card, CardContent } from "@/components/ui/card";
import { useLibrary } from "@/hooks/useLibrary";
import { READING_STATUS_LABELS, type ReadingStatus } from "@/types/library";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  Clock3,
  Heart,
  LibraryBig,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

type StatusFilter = "all" | ReadingStatus;

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos os status" },
  { value: "quero_ler", label: READING_STATUS_LABELS.quero_ler },
  { value: "lendo", label: READING_STATUS_LABELS.lendo },
  { value: "lido", label: READING_STATUS_LABELS.lido },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function LibraryPage() {
  const { books } = useLibrary();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const stats = useMemo(() => {
    const total = books.length;
    const favorites = books.filter((book) => book.favorite).length;
    const wantToRead = books.filter(
      (book) => book.status === "quero_ler",
    ).length;
    const reading = books.filter((book) => book.status === "lendo").length;
    const read = books.filter((book) => book.status === "lido").length;
    return { total, favorites, wantToRead, reading, read };
  }, [books]);

  const readingNow = useMemo(
    () => books.filter((book) => book.status === "lendo").slice(0, 4),
    [books],
  );
  const favoriteBooks = useMemo(
    () => books.filter((book) => book.favorite).slice(0, 4),
    [books],
  );
  const recentlyAdded = useMemo(() => books.slice(0, 4), [books]);

  const filteredBooks = useMemo(() => {
    const normalizedTerm = normalizeText(searchTerm.trim());
    return books.filter((book) => {
      if (statusFilter !== "all" && book.status !== statusFilter) return false;
      if (!normalizedTerm) return true;

      const haystack = [
        book.title ?? "",
        book.authors.join(" "),
        book.note,
        book.first_publish_year?.toString() ?? "",
      ]
        .map(normalizeText)
        .join(" ");

      return haystack.includes(normalizedTerm);
    });
  }, [books, searchTerm, statusFilter]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 text-left sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          BookRadar
        </p>
        <h1 className="m-0 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
          Dashboard e biblioteca
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Acompanhe seu progresso de leitura, encontre seus livros salvos e
          gerencie status, favoritos, avaliações e observações em um só lugar.
        </p>
      </header>

      <section
        aria-label="Resumo da biblioteca"
        className="grid grid-cols-2 gap-3 lg:grid-cols-5"
      >
        <LibraryStatCard
          label="Total salvos"
          value={stats.total}
          icon={<LibraryBig className="size-5" />}
        />
        <LibraryStatCard
          label="Favoritos"
          value={stats.favorites}
          icon={<Heart className="size-5" />}
        />
        <LibraryStatCard
          label="Quero ler"
          value={stats.wantToRead}
          icon={<Clock3 className="size-5" />}
        />
        <LibraryStatCard
          label="Lendo"
          value={stats.reading}
          icon={<BookOpen className="size-5" />}
        />
        <LibraryStatCard
          label="Lidos"
          value={stats.read}
          icon={<CheckCircle2 className="size-5" />}
        />
      </section>

      <section
        aria-label="Destaques da biblioteca"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <LibraryDashboardSection
          title="Lendo agora"
          description="Livros com status em leitura."
          books={readingNow}
          emptyMessage="Nenhum livro em leitura no momento."
          icon={<BookOpen className="size-4" />}
        />
        <LibraryDashboardSection
          title="Favoritos"
          description="Seus livros marcados como favoritos."
          books={favoriteBooks}
          emptyMessage="Você ainda não marcou livros como favoritos."
          icon={<Heart className="size-4" />}
        />
        <LibraryDashboardSection
          title="Adicionados recentemente"
          description="Últimos livros salvos na sua biblioteca."
          books={recentlyAdded}
          emptyMessage="Nenhum livro adicionado recentemente."
          icon={<BookMarked className="size-4" />}
        />
      </section>

      <section
        aria-label="Gerenciar biblioteca"
        className="flex flex-col gap-4 "
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="m-0 text-xl font-medium text-foreground">
              Gerenciar biblioteca
            </h2>
            <p className="text-sm text-muted-foreground">
              Pesquise, filtre por status e atualize o progresso de leitura
              diretamente nos livros salvos.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredBooks.length} de {books.length} livro(s)
          </p>
        </div>

        <Card className="bg-card/40">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[1fr_220px] sm:p-5">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pesquisar na biblioteca
              </span>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Título, autor, ano ou observação..."
                  className="h-10 w-full rounded-3xl border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/30"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filtrar por status
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-10 rounded-3xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </CardContent>
        </Card>

        {books.length === 0 ? (
          <Card className="border-dashed bg-card/40 text-center">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <LibraryBig className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-base font-medium text-foreground">
                  Sua biblioteca está vazia
                </p>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Pesquise livros e salve seus favoritos para organizar sua
                  leitura, mesmo sem conexão com a API depois.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredBooks.length === 0 ? (
          <Card className="border-dashed bg-card/40 text-center">
            <CardContent className="flex flex-col items-center gap-3 py-10">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-heading text-base font-medium text-foreground">
                  Nenhum livro encontrado
                </p>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Ajuste a busca ou o filtro de status para ver outros livros da
                  sua biblioteca.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBooks.map((book) => (
              <LibraryBookItem key={book.key} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
