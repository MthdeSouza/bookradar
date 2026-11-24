import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { FeedbackToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { LibraryProvider, useLibrary } from "@/contexts/LibraryContext";
import { LibraryPage } from "@/features/library/LibraryPage";
import { BookSearchPage } from "@/features/search/BookSearchPage";

type AppView = "search" | "library";

function AppContent() {
  const [view, setView] = useState<AppView>("search");
  const { books, feedback, clearFeedback } = useLibrary();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="font-heading text-base font-medium text-foreground">BookRadar</span>
          <nav className="flex items-center gap-2" aria-label="Navegação principal">
            <Button
              type="button"
              variant={view === "search" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("search")}
            >
              <Search data-icon="inline-start" />
              Pesquisar
            </Button>
            <Button
              type="button"
              variant={view === "library" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("library")}
            >
              <BookOpen data-icon="inline-start" />
              Minha biblioteca
              <span className="ml-1 rounded-full bg-background/20 px-2 py-0.5 text-xs">{books.length}</span>
            </Button>
          </nav>
        </div>
      </div>

      <main className="flex-1">
        {view === "search" ? <BookSearchPage /> : <LibraryPage />}
      </main>

      <FeedbackToast feedback={feedback} onClose={clearFeedback} />
    </div>
  );
}

function App() {
  return (
    <LibraryProvider>
      <AppContent />
    </LibraryProvider>
  );
}

export default App;
