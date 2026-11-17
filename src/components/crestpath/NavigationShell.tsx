"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  FileText,
  MessageSquareText,
  UserCircle2,
  Sun,
  Moon,
  LogIn,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";

export type CrestPathTab = "discover" | "parse" | "advisor" | "profile";

interface NavigationShellProps {
  activeTab: CrestPathTab;
  onSelectTab: (tab: CrestPathTab) => void;
  opportunityCount: number;
  profileName: string;
  profileAvatar?: string | null;
  sessionEmail?: string | null;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{
  id: CrestPathTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "discover", label: "Discover", icon: Compass },
  { id: "parse", label: "Parse Post", icon: FileText },
  { id: "advisor", label: "Advisor", icon: MessageSquareText },
  { id: "profile", label: "Profile", icon: UserCircle2 },
];

export function NavigationShell({
  activeTab,
  onSelectTab,
  opportunityCount,
  profileName,
  profileAvatar,
  sessionEmail,
  children,
}: NavigationShellProps) {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-canvas text-ink">
      {/* Desktop & Tablet Left Navigation Rail */}
      <aside
        aria-label="Primary navigation"
        className="hidden md:flex md:w-[84px] lg:w-[236px] shrink-0 flex-col justify-between border-r border-outline bg-surface sticky top-0 h-screen py-6 px-3 lg:px-5"
      >
        <div className="space-y-8">
          {/* Single-element Brand Wordmark */}
          <div className="flex items-center justify-center lg:justify-start px-1">
            <button
              type="button"
              onClick={() => onSelectTab("discover")}
              className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[10px]"
              aria-label="Intern Pilot Home"
            >
              <span className="w-9 h-9 rounded-[10px] bg-primary text-white dark:text-[#04261D] flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </span>
              <span className="hidden lg:inline font-display font-bold text-lg tracking-tight text-ink whitespace-nowrap">
                Intern Pilot
              </span>
            </button>
          </div>

          {/* 4 Core Tabs */}
          <nav className="space-y-1.5" aria-label="Workspace sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className={`w-full min-h-[48px] px-3 rounded-[12px] flex items-center justify-center lg:justify-between gap-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary-container text-on-primary-container font-semibold"
                      : "text-ink-secondary hover:bg-surface-low hover:text-ink"
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="hidden lg:inline whitespace-nowrap truncate">
                      {item.label}
                    </span>
                  </span>
                  {item.id === "discover" && (
                    <span className="hidden lg:inline font-mono tabular-nums text-xs text-ink-secondary">
                      {opportunityCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Controls */}
        <div className="space-y-2 pt-4 border-t border-outline">
          <button
            type="button"
            onClick={toggle}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            className="w-full min-h-[44px] px-3 rounded-[10px] flex items-center justify-center lg:justify-start gap-3 text-sm font-medium text-ink-secondary hover:bg-surface-low hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 shrink-0 text-secondary" />
            ) : (
              <Moon className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden lg:inline whitespace-nowrap">
              {theme === "dark" ? "Light Theme" : "Dark Theme"}
            </span>
          </button>

          {sessionEmail ? (
            <button
              type="button"
              onClick={() => onSelectTab("profile")}
              className="w-full min-h-[44px] px-3 rounded-[10px] flex items-center justify-center lg:justify-start gap-2.5 text-left hover:bg-surface-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Open profile settings"
            >
              <span className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary-container font-display font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                {profileAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileAvatar}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (profileName || sessionEmail).slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="hidden lg:block min-w-0">
                <span className="block text-xs font-semibold text-ink truncate">
                  {profileName || "Student Account"}
                </span>
                <span className="block text-[11px] text-ink-secondary truncate">
                  {sessionEmail}
                </span>
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full min-h-[44px] px-3 rounded-[10px] flex items-center justify-center lg:justify-start gap-3 text-sm font-medium text-primary hover:bg-surface-low transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap">Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Top App Bar (compact 52px to stay well within 15% mobile sticky cap) */}
      <header className="md:hidden sticky top-0 z-30 h-[52px] px-4 flex items-center justify-between gap-4 bg-surface/95 backdrop-blur-sm border-b border-outline">
        <button
          type="button"
          onClick={() => onSelectTab("discover")}
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[10px]"
          aria-label="Intern Pilot"
        >
          <span className="w-7 h-7 rounded-[8px] bg-primary text-white dark:text-[#04261D] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </span>
          <span className="font-display font-bold text-base tracking-tight text-ink whitespace-nowrap">
            Intern Pilot
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          {!sessionEmail && (
            <Link
              href="/login"
              className="min-h-[40px] px-3 rounded-[10px] text-xs font-semibold text-primary hover:bg-surface-low inline-flex items-center whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-ink-secondary hover:bg-surface-low hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-secondary" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 min-w-0 pb-20 md:pb-8">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          {children}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (60px height; total mobile sticky = 112px < 15% of 844px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-[60px] bg-surface border-t border-outline grid grid-cols-4 px-1"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive ? "text-primary font-semibold" : "text-ink-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
