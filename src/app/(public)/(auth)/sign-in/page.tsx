"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock, Mail, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeRedirectPath } from "@/lib/utils";

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirectPath(searchParams.get("redirect"), "/dashboard");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Signed in");
    router.push(redirect);
    router.refresh();
  };

  const google = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="animate-soft-rise">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center gap-3 lg:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="font-semibold">CAPP</span>
        </div>
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your restaurant workspace.</p>
        <Button variant="outline" className="mt-6 w-full" onClick={google} disabled={googleLoading}>
          {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" className="pl-9" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
          </div>
          <Button className="w-full" disabled={loading || !email || !password}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
