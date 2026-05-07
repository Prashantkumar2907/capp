"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function Switch({ checked, onCheckedChange, disabled, className, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-150 focus-ring",
        checked ? "border-primary bg-primary" : "border-input bg-muted",
        className
      )}
      aria-label={label}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white transition-transform duration-150",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
