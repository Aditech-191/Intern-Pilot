"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Banknote,
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  Square,
  Bookmark,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  ApplicationStatus,
  Opportunity,
  OpportunityTracking,
} from "@/types";
import {
  calculateSkillAlignment,
  getDeadlineInfo,
} from "@/lib/opportunity-utils";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Not Started",
  "Saved",
  "Preparing",
  "Applied",
  "Interview",
  "Accepted",
];

interface OpportunityDetailInspectorProps {
  opportunity: Opportunity | null;
  studentSkills: string[];
  tracking?: OpportunityTracking;
  onUpdateTracking: (
    id: string,
    patch: Partial<OpportunityTracking>
  ) => void;
  onToggleVerified: (id: string) => void;
  onDeleteOpportunity: (id: string) => void;
  onCloseMobile?: () => void;
  isMobileSheet?: boolean;
}

export function OpportunityDetailInspector({
  opportunity,
  studentSkills,
  tracking,
  onUpdateTracking,
  onToggleVerified,
  onDeleteOpportunity,
  onCloseMobile,
  isMobileSheet = false,
}: OpportunityDetailInspectorProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!opportunity) {
    return (
      <aside
        aria-label="Opportunity details"
        className="rounded-2xl border border-outline bg-surface p-8 text-center flex flex-col items-center justify-center min-h-[360px]"
      >
        <p className="font-display text-base font-semibold text-ink">
          Select an opportunity to inspect
        </p>
        <p className="text-sm text-ink-secondary mt-1.5 max-w-xs leading-relaxed">
          View full eligibility, check off requirements, track your application
          stage, and keep private notes here.
        </p>
      </aside>
    );
  }

  const currentTracking: OpportunityTracking = tracking || {
    status: "Not Started",
    saved: false,
    notes: "",
    checkedRequirements: [],
  };

  const alignment = calculateSkillAlignment(
    studentSkills,
    opportunity.requirements
  );
  const deadlineInfo = getDeadlineInfo(opportunity.deadline);

  const toggleRequirement = (req: string) => {
    const exists = currentTracking.checkedRequirements.includes(req);
    const next = exists
      ? currentTracking.checkedRequirements.filter((item) => item !== req)
      : [...currentTracking.checkedRequirements, req];
    onUpdateTracking(opportunity.id, { checkedRequirements: next });
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    onUpdateTracking(opportunity.id, {
      status,
      saved: status === "Saved" ? true : currentTracking.saved,
    });
  };

  return (
    <aside
      aria-label={`Details for ${opportunity.title}`}
      className={`rounded-2xl border border-outline bg-surface overflow-hidden flex flex-col ${
        isMobileSheet ? "max-h-[88vh]" : "sticky top-6 max-h-[calc(100vh-48px)]"
      }`}
    >
      {/* Header */}
      <div className="p-5 border-b border-outline flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
            <span className="font-medium text-ink">{opportunity.category}</span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onToggleVerified(opportunity.id)}
              className={`inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded ${
                opportunity.is_verified ? "text-strong" : "text-secondary"
              }`}
              title="Toggle verification status once you confirm the official source"
            >
              {opportunity.is_verified ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Imported (Mark Verified)
                </>
              )}
            </button>
          </div>

          <h2 className="font-display text-lg font-bold text-ink leading-snug">
            {opportunity.title}
          </h2>
          <p className="text-sm text-ink-secondary">
            {opportunity.organization}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onUpdateTracking(opportunity.id, {
                saved: !currentTracking.saved,
              })
            }
            aria-label={
              currentTracking.saved ? "Remove bookmark" : "Bookmark opportunity"
            }
            aria-pressed={currentTracking.saved}
            className={`w-10 h-10 rounded-[10px] border flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              currentTracking.saved
                ? "bg-primary-container text-on-primary-container border-primary/40"
                : "bg-surface-low text-ink-secondary border-outline hover:text-ink"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${currentTracking.saved ? "fill-current" : ""}`}
            />
          </button>

          {isMobileSheet && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close opportunity details"
              className="w-10 h-10 rounded-[10px] border border-outline bg-surface-low text-ink-secondary hover:text-ink flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="p-5 overflow-y-auto space-y-6 flex-1">
        {/* Key Facts Row */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-surface-low border border-outline/70">
            <dt className="text-xs text-ink-secondary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </dt>
            <dd className="font-medium text-ink mt-1">
              {opportunity.city
                ? `${opportunity.city} (${opportunity.region})`
                : opportunity.location}
            </dd>
          </div>

          <div className="p-3 rounded-xl bg-surface-low border border-outline/70">
            <dt className="text-xs text-ink-secondary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Deadline
            </dt>
            <dd
              className={`font-mono tabular-nums text-xs sm:text-sm font-medium mt-1 ${
                deadlineInfo.isUrgent || deadlineInfo.isExpired
                  ? "text-urgent"
                  : "text-ink"
              }`}
            >
              {opportunity.deadline
                ? deadlineInfo.label !== opportunity.deadline
                  ? `${opportunity.deadline} · ${deadlineInfo.label}`
                  : deadlineInfo.daysLeft !== null
                  ? `${opportunity.deadline} (${deadlineInfo.daysLeft}d)`
                  : opportunity.deadline
                : "Not listed"}
            </dd>
          </div>

          {opportunity.stipend && (
            <div className="sm:col-span-2 p-3 rounded-xl bg-surface-low border border-outline/70">
              <dt className="text-xs text-ink-secondary flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-secondary" />
                Stipend / Value
              </dt>
              <dd className="font-medium text-ink mt-1">
                {opportunity.stipend}
              </dd>
            </div>
          )}
        </dl>

        {/* Scam / Verification Warnings if any */}
        {opportunity.warnings && opportunity.warnings.length > 0 && (
          <div className="p-3.5 rounded-xl bg-tertiary-container/60 border border-tertiary/30 space-y-1.5">
            <p className="text-xs font-semibold text-on-tertiary-container flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Verification Notes
            </p>
            <ul className="text-xs text-on-tertiary-container/90 space-y-1 list-disc pl-4">
              {opportunity.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Application Stage Selector */}
        <div className="space-y-2">
          <label
            htmlFor={`status-${opportunity.id}`}
            className="block text-xs font-semibold text-ink-secondary"
          >
            Application Status
          </label>
          <div
            role="group"
            aria-label="Application status selector"
            className="grid grid-cols-3 gap-1.5"
          >
            {APPLICATION_STATUSES.map((st) => {
              const active = currentTracking.status === st;
              return (
                <button
                  key={st}
                  id={st === currentTracking.status ? `status-${opportunity.id}` : undefined}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  aria-pressed={active}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-[10px] text-xs font-medium border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active
                      ? "bg-primary text-white dark:text-[#04261D] border-primary font-semibold"
                      : "bg-surface-low text-ink-secondary border-outline hover:text-ink"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary & Eligibility */}
        {opportunity.summary && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-ink-secondary">
              Overview
            </h3>
            <p className="text-sm text-ink leading-relaxed">
              {opportunity.summary}
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-ink-secondary">
            Eligibility
          </h3>
          <p className="text-sm text-ink leading-relaxed">
            {opportunity.eligibility || "Not listed"}
          </p>
        </div>

        {/* Skill Alignment Breakdown */}
        <div className="space-y-2.5 pt-2 border-t border-outline/70">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-ink-secondary">
              Skill Alignment Breakdown
            </h3>
            <span className="font-mono tabular-nums text-xs font-semibold text-ink">
              {alignment.percentage !== null
                ? `${alignment.percentage}% (${alignment.matchedCount}/${alignment.totalCount})`
                : "Not scored"}
            </span>
          </div>

          {studentSkills.length === 0 ? (
            <p className="text-xs text-ink-secondary">
              Add your skills on the Profile tab to see which requirements match
              your background.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {alignment.matched.length > 0 && (
                <div className="flex items-start gap-2 text-strong">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">Matched:</strong>{" "}
                    {alignment.matched.join(", ")}
                  </span>
                </div>
              )}
              {alignment.missing.length > 0 && (
                <div className="flex items-start gap-2 text-urgent">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold">To build:</strong>{" "}
                    {alignment.missing.join(", ")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Requirements Checklist */}
        {opportunity.requirements.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-outline/70">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-ink-secondary">
                Requirements Checklist
              </h3>
              <span className="font-mono tabular-nums text-xs text-ink-secondary">
                {currentTracking.checkedRequirements.length}/
                {opportunity.requirements.length} ready
              </span>
            </div>

            <ul className="space-y-1.5">
              {opportunity.requirements.map((req) => {
                const checked =
                  currentTracking.checkedRequirements.includes(req);
                return (
                  <li key={req}>
                    <button
                      type="button"
                      onClick={() => toggleRequirement(req)}
                      aria-pressed={checked}
                      className="w-full min-h-[40px] px-3 py-2 rounded-[10px] border border-outline/70 bg-surface-low hover:border-primary/40 flex items-center gap-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {checked ? (
                        <CheckSquare className="w-4 h-4 text-strong shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-ink-secondary shrink-0" />
                      )}
                      <span
                        className={
                          checked
                            ? "line-through text-ink-secondary"
                            : "text-ink"
                        }
                      >
                        {req}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Personal Notes */}
        <div className="space-y-2 pt-2 border-t border-outline/70">
          <label
            htmlFor={`notes-${opportunity.id}`}
            className="block text-xs font-semibold text-ink-secondary"
          >
            Personal Application Notes
          </label>
          <textarea
            id={`notes-${opportunity.id}`}
            rows={3}
            value={currentTracking.notes}
            onChange={(e) =>
              onUpdateTracking(opportunity.id, { notes: e.target.value })
            }
            placeholder="Add referee contacts, essay points, or interview reminders..."
            className="w-full rounded-xl border border-outline bg-surface-low px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Footer: Official Link + Delete */}
      <div className="p-4 border-t border-outline bg-surface-low/60 flex flex-wrap items-center justify-between gap-2.5">
        {opportunity.link ? (
          <a
            href={opportunity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 py-2 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Official Application
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-xs text-ink-secondary">
            No application URL listed in post
          </span>
        )}

        {confirmDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onDeleteOpportunity(opportunity.id);
                setConfirmDelete(false);
              }}
              className="min-h-[40px] px-3 rounded-[10px] bg-urgent text-white text-xs font-semibold whitespace-nowrap"
            >
              Confirm Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="min-h-[40px] px-3 rounded-[10px] border border-outline bg-surface text-xs font-medium text-ink-secondary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Remove ${opportunity.title}`}
            className="min-h-[40px] px-3 rounded-[10px] text-xs font-medium text-urgent hover:bg-tertiary-container/50 inline-flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-urgent"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>
    </aside>
  );
}
