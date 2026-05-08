import type * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: string | null;
  hint?: string;
  id?: string;
  label: string;
  success?: string | null;
}

export function FormField({ children, className, error, hint, id, label, success }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p id={id ? `${id}-success` : undefined} className="inline-flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {success}
        </p>
      ) : null}
    </div>
  );
}
