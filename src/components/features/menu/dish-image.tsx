"use client";

import { useState } from "react";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface DishImageProps {
  alt: string;
  className?: string;
  src?: string | null;
}

export function DishImage({ alt, className, src }: DishImageProps) {
  const [failed, setFailed] = useState(false);
  const imageSrc = typeof src === "string" && src.length > 0 && !failed ? src : null;

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-secondary", className)}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 96px, 128px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[linear-gradient(135deg,var(--secondary),var(--muted))] text-muted-foreground"
          role="img"
          aria-label={`${alt} dish preview`}
        >
          <UtensilsCrossed className="h-7 w-7 text-primary/70" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
