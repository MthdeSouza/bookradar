import { AlertCircle, BookMarked, LoaderCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StateCardProps {
  title: string;
  description: string;
}

export function StateCard({
  title,
  description,
  icon,
}: StateCardProps & { icon: React.ReactNode }) {
  return (
    <Card className="border-dashed bg-card/40 text-center">
      <CardContent className="flex flex-col items-center gap-3 py-10">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="font-heading text-base font-medium text-foreground">{title}</p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchIdleState() {
  return (
    <StateCard
      icon={<Search className="size-5" aria-hidden="true" />}
      title="Pesquise por livros"
      description="Digite um título, autor ou termo livre para explorar o catálogo do BookRadar."
    />
  );
}

export function SearchLoadingState() {
  return (
    <StateCard
      icon={<LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
      title="Buscando livros"
      description="Consultando a API do BookRadar. Isso pode levar alguns instantes."
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <StateCard
      icon={<BookMarked className="size-5" aria-hidden="true" />}
      title="Nenhum resultado encontrado"
      description={`Não encontramos livros para "${query}". Tente outro termo, autor ou título.`}
    />
  );
}

export function SearchErrorState({ message }: { message: string }) {
  return (
    <StateCard
      icon={<AlertCircle className="size-5" aria-hidden="true" />}
      title="Não foi possível carregar os resultados"
      description={message}
    />
  );
}
