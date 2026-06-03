import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center justify-between gap-3 rounded-lg border bg-card/60 px-4 py-2.5 text-left transition hover:bg-card"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          {description && <div className="text-xs text-muted-foreground">{description}</div>}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>
      {open && <div>{children}</div>}
    </section>
  );
}
