"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RouteErrorStateProps = {
  title: string;
  description: string;
  reset: () => void;
  className?: string;
  homeHref?: string;
  homeLabel?: string;
};

export function RouteErrorState({ title, description, reset, className, homeHref, homeLabel = "Go home" }: RouteErrorStateProps) {
  return (
    <section className={cn("flex min-h-[calc(100vh-8rem)] items-center justify-center p-4", className)} role="alert" aria-live="assertive">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
            {homeHref ? (
              <Link
                href={homeHref}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-input bg-card px-4 text-[0.8125rem] font-medium leading-none text-foreground transition-colors duration-150 hover:bg-secondary focus-ring"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                {homeLabel}
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function DashboardRouteError({ title, description, reset }: Pick<RouteErrorStateProps, "title" | "description" | "reset">) {
  return <RouteErrorState title={title} description={description} reset={reset} homeHref="/dashboard" homeLabel="Dashboard" />;
}

export function PublicRouteError({ title, description, reset }: Pick<RouteErrorStateProps, "title" | "description" | "reset">) {
  return <RouteErrorState title={title} description={description} reset={reset} homeHref="/" homeLabel="Home" className="min-h-screen bg-background" />;
}
