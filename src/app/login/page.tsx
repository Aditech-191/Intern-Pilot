"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  MapPin,
  FileText,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";
import authCampusImg from "@/assets/images/auth_scholar_campus_1794946021243.jpg";
import { sanitizeRedirect } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme-context";

function CrestPathLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggle } = useTheme();
  const targetUrl = sanitizeRedirect(searchParams.get("redirect"));

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: isSignUp ? "signup" : "login",
          name,
          email,
          password,
          _hp_verify: honeypot,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(
          json.error || "Authentication failed. Please verify your details."
        );
        return;
      }

      router.push(targetUrl);
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Clean Minimal Top Header */}
      <header className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-label={
            theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
          }
          className="w-10 h-10 rounded-[10px] border border-outline bg-surface text-ink-secondary hover:text-ink flex items-center justify-center transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-secondary" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </header>

      {/* Main Editorial Card */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-10">
        <div className="w-full max-w-[980px] rounded-[24px] border border-outline bg-surface overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: Campus Artwork & Trust Highlights */}
          <div className="lg:col-span-6 relative bg-[#0B221B] flex flex-col justify-between min-h-[260px] lg:min-h-[560px]">
            <Image
              src={authCampusImg}
              alt="Ugandan university scholars walking along a sunlit stone campus colonnade"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 500px"
              referrerPolicy="no-referrer"
              className="object-cover object-center"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#081914]/95 via-[#081914]/60 to-[#081914]/25"
            />

            <div className="relative z-10 p-6 sm:p-8 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[10px] bg-[#63DCAD] text-[#04261D] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </span>
              <span className="font-display text-lg font-bold text-[#F6F3EB] tracking-tight">
                CrestPath
              </span>
            </div>

            <div className="relative z-10 p-6 sm:p-8 space-y-4">
              <h2 className="font-display text-2xl font-bold text-[#F6F3EB] leading-snug [text-wrap:balance]">
                Organize every internship and scholarship you discover across
                Uganda.
              </h2>

              <ul className="space-y-2.5 text-xs sm:text-sm text-[#D8E2DD]">
                <li className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-[#63DCAD] shrink-0 mt-0.5" />
                  <span>
                    Turn pasted WhatsApp forwards &amp; LinkedIn posts into
                    structured cards.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#63DCAD] shrink-0 mt-0.5" />
                  <span>
                    Filter opportunities across Uganda regions &amp; measure
                    skill alignment.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#63DCAD] shrink-0 mt-0.5" />
                  <span>
                    Grounded career advisor that strictly uses your saved
                    workspace entries.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Sign In / Create Account Form */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
                  {isSignUp ? "Create your student account" : "Sign in to CrestPath"}
                </h1>
                <p className="text-sm text-ink-secondary mt-1">
                  {isSignUp
                    ? "Start a clean, private workspace for your own opportunities."
                    : "Enter your student email to continue."}
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-xl bg-tertiary-container/60 border border-tertiary/35 text-on-tertiary-container text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="_hp_verify"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden pointer-events-none"
                  aria-hidden="true"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />

                {isSignUp && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-semibold text-ink-secondary"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="auth-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-outline bg-surface-low text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-ink-secondary"
                  >
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.ac.ug"
                      className="w-full min-h-[46px] pl-10 pr-4 rounded-xl border border-outline bg-surface-low text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-ink-secondary"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full min-h-[46px] pl-10 pr-11 rounded-xl border border-outline bg-surface-low text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] rounded-[12px] bg-primary hover:opacity-90 disabled:opacity-60 text-white dark:text-[#04261D] text-sm font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isLoading
                    ? "Please wait..."
                    : isSignUp
                    ? "Create Account"
                    : "Sign In"}
                </button>
              </form>

              <div className="pt-3 border-t border-outline text-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setIsSignUp(!isSignUp);
                  }}
                  className="text-xs sm:text-sm font-medium text-primary hover:underline"
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "New to CrestPath? Create an account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas flex items-center justify-center text-ink-secondary text-sm">
          Loading CrestPath...
        </div>
      }
    >
      <CrestPathLoginForm />
    </Suspense>
  );
}
