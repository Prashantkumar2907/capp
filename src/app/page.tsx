"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  UtensilsCrossed, QrCode, ChefHat, BarChart3, CreditCard, Users,
  Shield, Zap, Globe, ArrowRight, Check, Star, Menu, X,
  Smartphone, Clock, TrendingUp, Sparkles,
} from "lucide-react";

const FEATURES = [
  { icon: QrCode, title: "QR Code Ordering", description: "Customers scan, browse your menu, and order directly from their phone. Zero wait time." },
  { icon: ChefHat, title: "Kitchen Display", description: "Real-time KDS with item-level tracking, timers, and audio alerts for your kitchen team." },
  { icon: BarChart3, title: "Live Analytics", description: "Revenue trends, top dishes, peak hours, and customer feedback — all in real-time dashboards." },
  { icon: CreditCard, title: "UPI & Razorpay", description: "Accept payments via UPI QR codes or Razorpay. Automatic payment tracking and reconciliation." },
  { icon: Users, title: "Staff & Roles", description: "Owner, admin, manager, waiter, kitchen, cashier — granular role-based access for every team member." },
  { icon: Globe, title: "Multi-Branch", description: "Manage multiple branches from a single dashboard. Per-branch menus, pricing, and analytics." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Sign Up & Set Up", description: "Create your account, name your restaurant, and configure tax settings in under 2 minutes.", icon: Sparkles },
  { step: "02", title: "Build Your Menu", description: "Add categories and dishes with prices. We'll generate QR codes for every table automatically.", icon: UtensilsCrossed },
  { step: "03", title: "Start Serving", description: "Print QR codes, place on tables. Customers order, kitchen cooks, waiters serve. You track everything.", icon: TrendingUp },
];

const PLANS = [
  {
    name: "Starter",
    price: { monthly: 999, yearly: 799 },
    description: "Perfect for small restaurants",
    features: ["1 Branch", "10 Staff members", "100 Menu items", "QR ordering", "Basic analytics", "UPI payments", "Email support"],
    popular: false,
  },
  {
    name: "Growth",
    price: { monthly: 1599, yearly: 1299 },
    description: "For growing restaurant businesses",
    features: ["2 Branches", "25 Staff members", "300 Menu items", "QR ordering", "Advanced analytics", "UPI + Razorpay", "Coupons & discounts", "Priority support"],
    popular: true,
  },
  {
    name: "Pro",
    price: { monthly: 2499, yearly: 1999 },
    description: "For restaurant chains",
    features: ["5 Branches", "Unlimited staff", "Unlimited menu items", "QR ordering", "Full analytics suite", "All payment methods", "Coupons & discounts", "API access", "Dedicated support"],
    popular: false,
  },
];

const TESTIMONIALS = [
  { name: "Rahul Sharma", role: "Owner, Spice Garden", text: "RestaurantOS transformed how we run our restaurant. Orders come in instantly, the kitchen is always in sync, and our revenue tracking is effortless.", rating: 5 },
  { name: "Priya Desai", role: "Manager, Chai & Co.", text: "The QR ordering system alone saved us from hiring an extra waiter. Customers love the convenience, and we love the efficiency.", rating: 5 },
  { name: "Amit Patel", role: "Owner, Patel's Thali House", text: "Managing 3 branches used to be chaos. Now I see everything from one dashboard. The analytics helped us identify our best-selling dishes.", rating: 5 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ================================ */}
      {/* HEADER / NAV */}
      {/* ================================ */}
      <motion.header
        style={{ backdropFilter: `blur(${16}px)` }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-transparent"
      >
        <motion.div
          style={{ opacity: headerOpacity }}
          className="absolute inset-0 bg-background/80 border-b border-border"
        />
        <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">RestaurantOS</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="text-sm px-5">
                Get Started Free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden bg-card border-t border-border"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-sm py-2 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" className="block text-sm py-2 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#testimonials" className="block text-sm py-2 text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <div className="flex gap-2 pt-2">
                <Link href="/sign-in" className="flex-1"><Button variant="outline" className="w-full text-sm">Sign In</Button></Link>
                <Link href="/sign-up" className="flex-1"><Button className="w-full text-sm">Sign Up</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* ================================ */}
      {/* HERO */}
      {/* ================================ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-20 left-1/4 h-72 w-72 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-1/4 h-64 w-64 bg-primary/5 rounded-full blur-[80px]" />
        
        {/* Floating dots */}
        <div className="absolute top-32 left-[10%] h-2 w-2 rounded-full bg-primary/30 animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-48 right-[15%] h-3 w-3 rounded-full bg-primary/20 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-[20%] h-2.5 w-2.5 rounded-full bg-primary/25 animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-medium border-primary/30 text-primary bg-primary/5">
              <Sparkles className="h-3 w-3 mr-1.5" /> 14-day free trial · No credit card required
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] max-w-4xl mx-auto"
          >
            Run your restaurant{" "}
            <span className="gradient-text">smarter</span>,{" "}
            not harder
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            From QR ordering to kitchen displays, staff management to analytics —
            everything you need to run a modern restaurant, in one powerful platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/sign-up">
              <Button size="lg" className="text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Start Free Trial <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-base px-8 h-12 rounded-xl">
                See Features
              </Button>
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[0,1,2,3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {["RS","PD","AK","MJ"][i]}
                  </div>
                ))}
              </div>
              <span>Trusted by <strong className="text-foreground">500+</strong> restaurants</span>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1"><strong className="text-foreground">4.9</strong>/5 rating</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================ */}
      {/* FEATURES */}
      {/* ================================ */}
      <section id="features" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 text-xs px-3 py-1 border-primary/30 text-primary">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything your restaurant needs
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              One platform to manage orders, kitchen, staff, payments, and analytics. Built for Indian restaurants.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((feature) => (
              <motion.div key={feature.title} variants={item}>
                <Card className="h-full border-border/60 card-hover group bg-card/80">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ================================ */}
      {/* HOW IT WORKS */}
      {/* ================================ */}
      <section className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 text-xs px-3 py-1 border-primary/30 text-primary">How it Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              No complex setup. No training needed. Get your restaurant digitized in 3 simple steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="relative inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 border-2 border-primary/20 mb-5 mx-auto group">
                  <step.icon className="h-6 w-6 text-primary" />
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================ */}
      {/* PRICING */}
      {/* ================================ */}
      <section id="pricing" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="outline" className="mb-4 text-xs px-3 py-1 border-primary/30 text-primary">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Start with a 14-day free trial. No credit card required. Upgrade anytime.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`text-sm ${!yearlyBilling ? "text-foreground font-medium" : "text-muted-foreground"}`}>Monthly</span>
              <Switch checked={yearlyBilling} onCheckedChange={setYearlyBilling} />
              <span className={`text-sm ${yearlyBilling ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Yearly <Badge className="ml-1.5 text-[10px] h-5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Save 20%</Badge>
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`h-full relative overflow-hidden ${plan.popular ? "border-primary/50 shadow-lg shadow-primary/10" : "border-border/60"}`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
                  )}
                  <CardContent className="p-6">
                    {plan.popular && (
                      <Badge className="mb-3 bg-primary/10 text-primary text-[10px]">Most Popular</Badge>
                    )}
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ₹{yearlyBilling ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                    {yearlyBilling && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Billed yearly (₹{plan.price.yearly * 12}/year)
                      </p>
                    )}
                    <Link href="/sign-up">
                      <Button
                        className={`w-full mt-6 h-10 text-sm ${plan.popular ? "" : ""}`}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        Start Free Trial
                      </Button>
                    </Link>
                    <div className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================ */}
      {/* TESTIMONIALS */}
      {/* ================================ */}
      <section id="testimonials" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 text-xs px-3 py-1 border-primary/30 text-primary">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Loved by restaurant owners
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/60 bg-card/80">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`h-4 w-4 ${s <= testimonial.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground mb-5">
                      &ldquo;{testimonial.text}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {testimonial.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================ */}
      {/* FINAL CTA */}
      {/* ================================ */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-primary/8 rounded-full blur-[120px]" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to modernize your restaurant?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Join hundreds of restaurants already using RestaurantOS. Start your free trial today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="text-base px-8 h-12 rounded-xl shadow-lg shadow-primary/25">
                Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14-day free trial · No credit card · Cancel anytime
          </p>
        </motion.div>
      </section>

      {/* ================================ */}
      {/* FOOTER */}
      {/* ================================ */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">RestaurantOS</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The complete restaurant management platform built for Indian restaurants.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#testimonials" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Resources</h4>
              <div className="space-y-2">
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">API Reference</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Refund Policy</a>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} RestaurantOS. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Secured with Supabase · Hosted on Vercel</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}