"use client";

import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side — Brand panel */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-10" />

        {/* Animated blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 h-64 w-64 bg-white/20 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 right-20 h-48 w-48 bg-white/10 rounded-full blur-[60px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 -translate-y-1/2 -right-10 h-32 w-32 bg-white/10 rounded-full blur-[40px]"
        />

        {/* Floating food icons */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-12 text-white/10 text-5xl select-none pointer-events-none"
        >
          🍽️
        </motion.div>
        <motion.div
          animate={{ y: [6, -6, 6], rotate: [3, -3, 3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-1/3 left-8 text-white/10 text-4xl select-none pointer-events-none"
        >
          ☕
        </motion.div>
        
        {/* Content */}
        <div className="relative flex flex-col justify-between p-12 text-primary-foreground w-full">
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <UtensilsCrossed className="h-5 w-5" />
            </motion.div>
            <span className="text-xl font-bold">RestaurantOS</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6 max-w-md"
          >
            <h2 className="text-3xl font-bold leading-tight">
              The complete platform for modern restaurants
            </h2>
            <p className="text-base text-white/80 leading-relaxed">
              QR ordering, kitchen displays, staff management, payments, and analytics — all in one place.
            </p>
            
            {/* Feature highlights */}
            <div className="space-y-3 pt-4">
              {[
                "Set up in under 5 minutes",
                "No hardware required",
                "Works on any device",
              ].map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.12 }}
                  className="flex items-center gap-3 text-sm text-white/90"
                >
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="text-sm text-white/50">
            © {new Date().getFullYear()} RestaurantOS
          </div>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">RestaurantOS</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
