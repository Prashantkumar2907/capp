import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn("h-10 rounded-xl border border-input bg-card px-3 text-sm focus-ring", className)}
      {...props}
    />
  )
);

Select.displayName = "Select";
