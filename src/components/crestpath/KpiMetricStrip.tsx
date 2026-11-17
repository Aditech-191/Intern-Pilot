"use client";

import React from "react";
import { Target, Bookmark, CheckCircle2, Clock } from "lucide-react";

export type KpiFilterKey = "top_matches" | "saved" | "applied" | "closing_soon";

interface KpiMetricStripProps {
  topMatchesCount: number;
  savedCount: number;
  appliedCount: number;
  closingSoonCount: number;
  activeKpi: KpiFilterKey | null;
  onSelectKpi: (key: KpiFilterKey) => void;
}

export function KpiMetricStrip({
  topMatchesCount,
  savedCount,
  appliedCount,
  closingSoonCount,
  activeKpi,
  onSelectKpi,
}: KpiMetricStripProps) {
  const items: Array<{
    key: KpiFilterKey;
    label: string;
    value: number;
    caption: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
  }> = [
    {
      key: "top_matches",
      label: "Top Matches",
      value: topMatchesCount,
      caption: "50%+ skill alignment",
      icon: Target,
      accentClass: "text-strong",
    },
    {
      key: "saved",
      label: "Saved",
      value: savedCount,
      caption: "Bookmarked to review",
      icon: Bookmark,
      accentClass: "text-primary",
    },
    {
      key: "applied",
      label: "Applied",
      value: appliedCount,
      caption: "Submitted or beyond",
      icon: CheckCircle2,
      accentClass: "text-secondary",
    },
    {
      key: "closing_soon",
      label: "Closing Soon",
      value: closingSoonCount,
      caption: "Due within 7 days",
      icon: Clock,
      accentClass: "text-urgent",
    },
  ];

  return (
    <section
      aria-label="Application metrics"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeKpi === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelectKpi(item.key)}
            aria-pressed={isActive}
            className={`text-left p-4 rounded-2xl border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? "bg-primary-container/50 border-primary"
                : "bg-surface border-outline hover:bg-surface-low"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-ink-secondary whitespace-nowrap">
                {item.label}
              </span>
              <Icon className={`w-4 h-4 shrink-0 ${item.accentClass}`} />
            </div>
            <div className="font-mono tabular-nums text-2xl sm:text-[28px] font-semibold text-ink leading-none">
              {item.value}
            </div>
            <p className="text-xs text-ink-secondary mt-1.5 truncate">
              {item.caption}
            </p>
          </button>
        );
      })}
    </section>
  );
}
