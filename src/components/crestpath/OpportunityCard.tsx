"use client";

import React from "react";
import {
  Bookmark,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  ChevronRight,
} from "lucide-react";
import { Opportunity, OpportunityTracking } from "@/types";
import {
  calculateSkillAlignment,
  getDeadlineInfo,
} from "@/lib/opportunity-utils";

interface OpportunityCardProps {
  opportunity: Opportunity;
  studentSkills: string[];
  tracking?: OpportunityTracking;
  isSelected: boolean;
  onSelect: (opportunity: Opportunity) => void;
  onToggleSave: (id: string) => void;
  onToggleApplied: (id: string) => void;
}

export function OpportunityCard({
  opportunity,
  studentSkills,
  tracking,
  isSelected,
  onSelect,
  onToggleSave,
  onToggleApplied,
}: OpportunityCardProps) {
  const alignment = calculateSkillAlignment(
    studentSkills,
    opportunity.requirements
  );
  const deadlineInfo = getDeadlineInfo(opportunity.deadline);

  const isSaved = Boolean(tracking?.saved || tracking?.status === "Saved");
  const isApplied = Boolean(
    tracking &&
      (tracking.status === "Applied" ||
        tracking.status === "Interview" ||
        tracking.status === "Accepted")
  );

  const barColorClass =
    alignment.tier === "strong"
      ? "bg-strong"
      : alignment.tier === "moderate"
      ? "bg-moderate"
      : alignment.tier === "gap"
      ? "bg-urgent"
      : "bg-outline";

  const tierTextClass =
    alignment.tier === "strong"
      ? "text-strong"
      : alignment.tier === "moderate"
      ? "text-moderate"
      : alignment.tier === "gap"
      ? "text-urgent"
      : "text-ink-secondary";

  const tierLabel =
    alignment.tier === "strong"
      ? "Strong fit"
      : alignment.tier === "moderate"
      ? "Moderate fit"
      : alignment.tier === "gap"
      ? "Skill gap"
      : studentSkills.length === 0
      ? "Add skills in Profile to score"
      : "No requirements listed";

  return (
    <article
      className={`rounded-2xl border bg-surface transition-colors duration-150 ${
        isSelected
          ? "border-primary ring-1 ring-primary"
          : "border-outline hover:border-primary/45"
      }`}
    >
      {/* Main clickable detail area */}
      <button
        type="button"
        onClick={() => onSelect(opportunity)}
        className="w-full text-left p-5 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-2xl"
      >
        {/* Clean Unboxed Editorial Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-secondary mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-ink">{opportunity.category}</span>
            <span aria-hidden="true">·</span>
            {opportunity.is_verified ? (
              <span className="inline-flex items-center gap-1 text-strong font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-secondary font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Imported
              </span>
            )}
            {tracking?.status && tracking.status !== "Not Started" && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-primary">
                  {tracking.status}
                </span>
              </>
            )}
          </div>

          <span
            className={`font-mono tabular-nums text-xs font-medium ${
              deadlineInfo.isUrgent || deadlineInfo.isExpired
                ? "text-urgent"
                : "text-ink-secondary"
            }`}
          >
            {deadlineInfo.label}
          </span>
        </div>

        {/* Title & Organization */}
        <h3 className="font-display text-base sm:text-lg font-semibold text-ink leading-snug">
          {opportunity.title}
        </h3>
        <p className="text-sm text-ink-secondary mt-0.5">
          {opportunity.organization}
        </p>

        {/* Location & Stipend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-secondary mt-2.5">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {opportunity.city
              ? `${opportunity.city} (${opportunity.region})`
              : opportunity.location}
          </span>
          {opportunity.stipend && (
            <span className="inline-flex items-center gap-1 text-ink font-medium">
              <Banknote className="w-3.5 h-3.5 shrink-0 text-secondary" />
              {opportunity.stipend}
            </span>
          )}
        </div>

        {/* Visual Skill Alignment Indicator */}
        <div className="mt-4 pt-3.5 border-t border-outline/70 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={`font-medium ${tierTextClass}`}>{tierLabel}</span>
            <span className="font-mono tabular-nums font-medium text-ink">
              {alignment.percentage !== null
                ? `${alignment.percentage}% · ${alignment.matchedCount}/${alignment.totalCount} skills`
                : `${alignment.totalCount} reqs`}
            </span>
          </div>

          <div
            role="progressbar"
            aria-label={`Skill alignment ${alignment.percentage ?? 0}%`}
            aria-valuenow={alignment.percentage ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-2 w-full rounded-full bg-surface-low border border-outline/60 overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
              style={{
                width:
                  alignment.percentage !== null
                    ? `${Math.max(alignment.percentage, 4)}%`
                    : "0%",
              }}
            />
          </div>

          {opportunity.requirements.length > 0 && (
            <p className="text-xs text-ink-secondary truncate">
              {alignment.matched.length > 0 && (
                <span className="text-strong font-medium">
                  Matched: {alignment.matched.slice(0, 3).join(", ")}
                </span>
              )}
              {alignment.matched.length > 0 && alignment.missing.length > 0 && (
                <span aria-hidden="true"> · </span>
              )}
              {alignment.missing.length > 0 && (
                <span>
                  {alignment.matched.length > 0 ? "Missing: " : "Requires: "}
                  {alignment.missing.slice(0, 3).join(", ")}
                </span>
              )}
            </p>
          )}
        </div>
      </button>

      {/* Action Footer with >=44px Touch Targets */}
      <div className="px-4 py-2.5 border-t border-outline/70 flex items-center justify-between gap-2 bg-surface-low/60 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleSave(opportunity.id)}
            aria-pressed={isSaved}
            aria-label={
              isSaved
                ? `Remove ${opportunity.title} from saved`
                : `Save ${opportunity.title}`
            }
            className={`min-h-[40px] px-3 rounded-[10px] text-xs font-medium inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isSaved
                ? "bg-primary-container text-on-primary-container border-primary/40 font-semibold"
                : "bg-surface text-ink-secondary border-outline hover:text-ink"
            }`}
          >
            <Bookmark
              className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`}
            />
            {isSaved ? "Saved" : "Save"}
          </button>

          <button
            type="button"
            onClick={() => onToggleApplied(opportunity.id)}
            aria-pressed={isApplied}
            aria-label={
              isApplied
                ? `Unmark ${opportunity.title} as applied`
                : `Mark ${opportunity.title} as applied`
            }
            className={`min-h-[40px] px-3 rounded-[10px] text-xs font-medium inline-flex items-center gap-1.5 border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isApplied
                ? "bg-secondary-container text-on-secondary-container border-secondary/40 font-semibold"
                : "bg-surface text-ink-secondary border-outline hover:text-ink"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isApplied ? "Applied" : "Mark Applied"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSelect(opportunity)}
          aria-label={`Inspect details for ${opportunity.title}`}
          className="min-h-[40px] px-2.5 rounded-[10px] text-xs font-medium text-primary hover:bg-surface inline-flex items-center gap-1 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Details
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
