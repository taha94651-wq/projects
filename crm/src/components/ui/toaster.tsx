"use client";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useToasts } from "@/lib/store/store";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 end-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-md border bg-card p-3 text-sm shadow-lg fade-in",
            t.kind === "error" ? "border-destructive/50" : "border-success/40",
          )}
        >
          {t.kind === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted-foreground">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
