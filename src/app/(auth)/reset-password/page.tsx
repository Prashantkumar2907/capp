"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, Check, X } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const { register, handleSubmit, formState: { errors }, control } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema) as Resolver<ResetPasswordInput>,
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });
  const requirements = [
    { met: password.length >= 6, label: "At least 6 characters" },
    { met: /[A-Z]/.test(password), label: "One uppercase letter" },
    { met: /[0-9]/.test(password), label: "One number" },
  ];

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully!");
    router.push("/dashboard");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" type="password" placeholder="New password" className="h-11 pl-10 text-sm" {...register("password")} />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}

          {/* Requirements checklist */}
          {password && (
            <div className="space-y-1.5 mt-2">
              {requirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2 text-xs">
                  {req.met ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="confirmPassword" type="password" placeholder="Confirm new password" className="h-11 pl-10 text-sm" {...register("confirmPassword")} />
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </form>
    </motion.div>
  );
}
