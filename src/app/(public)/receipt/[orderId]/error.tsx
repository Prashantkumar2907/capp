"use client";

import { ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceiptError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md">
        <CardContent className="p-6 text-center">
          <ReceiptText className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Receipt could not load</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error.message || "Please retry from the receipt link."}</p>
          <Button className="mt-4" onClick={reset}>
            Retry
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
