"use client";

import { useEffect, useState } from "react";

export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setHasMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return hasMounted;
}
