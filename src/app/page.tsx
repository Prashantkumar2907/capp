"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  UtensilsCrossed,
  QrCode,
  ChefHat,
  BarChart3,
  Users,
  IndianRupee,
  Globe,
  Check,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: QrCode, title: "QR Ordering", desc: "Scan, browse, order from phone" },
  { icon: ChefHat, title: "Kitchen KDS", desc: "Real-time order tracking" },
  { icon: IndianRupee, title: "UPI Payments", desc: "Zero-fee direct UPI QR" },
  { icon: BarChart3, title: "Analytics", desc: "Revenue & top dish insights" },
  { icon: Users, title: "Role Access", desc: "Owner, Admin, Kitchen, Waiter" },
  { icon: Globe, title: "Multi-Branch", desc: "One dashboard, all branches" },
];

const plans = [
  {
    name: "Starter", price: "\u20b9999", period: "/mo", popular: false,
    features: ["1 Branch", "5 Staff", "100 Items", "QR Ordering", "UPI Payments"],
  },
  {
    name: "Growth", price: "\u20b91,599", period: "/mo", popular: true,
    features: ["2 Branches", "15 Staff", "300 Items", "Advanced Analytics", "Priority Support"],
  },
  {
    name: "Pro", price: "\u20b92,499", period: "/mo", popular: false,
    features: ["3 Branches", "50 Staff", "Unlimited Items", "API Access", "Custom Branding"],
  },
];

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-full h-full flex items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg lg:text-xl font-bold font-poppins">RestaurantOS</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-xs lg:text-sm h-8">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="bg-teal-500 hover:bg-teal-600 text-white text-xs lg:text-sm h-8">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="h-screen flex items-center justify-center px-4 sm:px-6 lg:px-10 pt-14 w-full">
        <motion.div
          className="text-center w-full max-w-3xl lg:max-w-4xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-block px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-300 text-xs lg:text-sm font-medium mb-4">
            Built for Indian Restaurants
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-poppins leading-tight">
            Manage Your Restaurant{" "}
            <span className="text-teal-500">Effortlessly</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base lg:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl lg:max-w-2xl mx-auto">
            QR ordering, kitchen display, UPI payments & multi-branch analytics in one platform.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Link href="/sign-up">
              <Button className="bg-teal-500 hover:bg-teal-600 text-white h-9 lg:h-10 text-sm lg:text-base px-5 lg:px-6">
                Start Free <ArrowRight className="ml-1.5 h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="h-9 lg:h-10 text-sm lg:text-base px-5 lg:px-6 border-zinc-300 dark:border-zinc-700">
                Features
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 py-16 bg-zinc-50 dark:bg-zinc-900 w-full">
        <div className="w-full max-w-6xl">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-poppins text-center mb-8 lg:mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white dark:bg-zinc-800 rounded-xl p-4 lg:p-6 border border-zinc-200 dark:border-zinc-700 hover:border-teal-300 dark:hover:border-teal-600 hover:-translate-y-0.5 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-200 cursor-default"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center mb-2 lg:mb-3">
                  <f.icon className="h-4 w-4 lg:h-5 lg:w-5 text-teal-500" />
                </div>
                <h3 className="text-sm lg:text-base font-semibold font-poppins">{f.title}</h3>
                <p className="text-xs lg:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-10 py-16 w-full">
        <div className="w-full max-w-5xl">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-poppins text-center mb-2">Pricing</h2>
          <p className="text-sm lg:text-base text-zinc-500 dark:text-zinc-400 text-center mb-8 lg:mb-12">Simple pricing. No hidden fees.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 w-full">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                className={"bg-white dark:bg-zinc-800 rounded-xl p-5 lg:p-7 border relative " + (p.popular ? "border-teal-500 border-2 shadow-sm" : "border-zinc-200 dark:border-zinc-700")}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
              >
                {p.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] lg:text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <div className="text-center mb-4 lg:mb-6">
                  <p className="text-sm lg:text-base font-medium text-zinc-500 dark:text-zinc-400">{p.name}</p>
                  <p className="text-2xl lg:text-3xl font-bold mt-1">{p.price}<span className="text-xs lg:text-sm font-normal text-zinc-400">{p.period}</span></p>
                </div>
                <ul className="space-y-2 lg:space-y-3 mb-5 lg:mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs lg:text-sm text-zinc-600 dark:text-zinc-300">
                      <Check className="h-3 w-3 lg:h-4 lg:w-4 text-teal-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className="block">
                  <Button
                    size="sm"
                    className={"w-full h-8 lg:h-10 text-xs lg:text-sm " + (p.popular ? "bg-teal-500 hover:bg-teal-600 text-white" : "")}
                    variant={p.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-12 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center px-4 w-full">
        <p className="text-xs lg:text-sm text-zinc-400">&copy; {new Date().getFullYear()} RestaurantOS. All rights reserved.</p>
      </footer>
    </div>
  );
}