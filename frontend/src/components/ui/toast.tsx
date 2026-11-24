import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { FeedbackMessage } from "@/contexts/LibraryContext";
import { cn } from "cn";

interface FeedbackToastProps {
  feedback: FeedbackMessage | null;
  onClose: () => void;
  durationMs?: number;
}

const styles: Record<FeedbackMessage["type"], string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
  error: "border-destructive/30 bg-destructive/10 text-foreground",
  info: "border-primary/30 bg-primary/10 text-foreground",
};

const icons = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
} as const;

export function FeedbackToast({ feedback, onClose, durationMs = 3500 }: FeedbackToastProps) {
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timeout);
  }, [feedback, onClose, durationMs]);

  if (!feedback) return null;

  const Icon = icons[feedback.type];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:justify-end sm:px-6">
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-3xl border p-4 shadow-lg backdrop-blur",
          styles[feedback.type],
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p className="flex-1 text-sm">{feedback.text}</p>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Fechar aviso">
          <X />
        </Button>
      </div>
    </div>
  );
}
