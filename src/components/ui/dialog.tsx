"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export function Dialog({ open, title, children, onOpenChange, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/45" aria-label="Close dialog" onClick={() => onOpenChange(false)} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn("relative w-full max-w-md rounded-2xl border bg-card text-card-foreground animate-popover-in", className)}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  );
}
