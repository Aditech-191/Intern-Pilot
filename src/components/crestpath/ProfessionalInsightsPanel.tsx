"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  Linkedin,
  RefreshCw,
  ExternalLink,
  Plus,
  Check,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { ProfessionalProfileSummary, StudentProfile } from "@/types";
import { getNewDiscoveredSkills } from "@/lib/services/professional-profile-utils";

interface ProfessionalInsightsPanelProps {
  profile: StudentProfile;
  onSaveProfile: (updated: StudentProfile) => void;
}

const CONFIDENCE_LABELS: Record<
  ProfessionalProfileSummary["confidence"],
  { label: string; className: string }
> = {
  verified_web: {
    label: "Verified Real-Time Web Data",
    className:
      "bg-primary-container text-on-primary-container border border-primary/25",
  },
  partial: {
    label: "Partial Public Match",
    className:
      "bg-secondary-container text-on-secondary-container border border-secondary/25",
  },
  not_found: {
    label: "No Public Profile Found",
    className:
      "bg-surface-low text-ink-secondary border border-outline",
  },
};

export function ProfessionalInsightsPanel({
  profile,
  onSaveProfile,
}: ProfessionalInsightsPanelProps) {
  const [linkedinInput, setLinkedinInput] = useState(profile.linkedinUrl || "");
  const [nameInput, setNameInput] = useState(profile.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    setLinkedinInput(profile.linkedinUrl || "");
    setNameInput(profile.name || "");
  }, [profile.id, profile.linkedinUrl, profile.name]);

  const insights = profile.professionalInsights ?? null;

  const newDiscoveredSkills = useMemo(() => {
    if (!insights?.extractedSkills?.length) return [];
    return getNewDiscoveredSkills(profile.skills, insights.extractedSkills);
  }, [profile.skills, insights]);

  const savedSkillSet = useMemo(
    () => new Set(profile.skills.map((s) => s.trim().toLowerCase())),
    [profile.skills]
  );

  const handleFetchInsights = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setSyncNotice("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/profile/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput.trim() || profile.name,
          university: profile.university,
          course: profile.course,
          linkedinUrl: linkedinInput.trim(),
          githubUrl: profile.githubUrl || "",
          existingSkills: profile.skills,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(
          json.error ||
            "Unable to fetch real-time Google & LinkedIn insights right now."
        );
        return;
      }

      const data = json.data as ProfessionalProfileSummary;
      onSaveProfile({
        ...profile,
        linkedinUrl: data.queriedLinkedinUrl || profile.linkedinUrl,
        professionalInsights: data,
      });
    } catch {
      setErrorMsg(
        "Network error contacting the real-time profile insights service. Please retry."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSkills = () => {
    if (newDiscoveredSkills.length === 0) return;
    const mergedSkills = [...profile.skills, ...newDiscoveredSkills];
    onSaveProfile({
      ...profile,
      skills: mergedSkills,
    });
    setSyncNotice(
      `Added ${newDiscoveredSkills.length} discovered ${
        newDiscoveredSkills.length === 1 ? "skill" : "skills"
      } to your profile for sharper alignment scores.`
    );
  };

  const handleClearInsights = () => {
    setErrorMsg("");
    setSyncNotice("");
    onSaveProfile({
      ...profile,
      professionalInsights: null,
    });
  };

  const formattedFetchedTime = useMemo(() => {
    if (!insights?.fetchedAt) return "";
    const parsed = new Date(insights.fetchedAt);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [insights?.fetchedAt]);

  return (
    <section
      aria-label="Google and LinkedIn real-time profile insights"
      className="rounded-2xl border border-outline bg-surface p-4 sm:p-5 space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="w-4 h-4 text-primary shrink-0" />
            <h2 className="font-display text-base font-semibold text-ink tracking-tight">
              Google &amp; LinkedIn Real-Time Profile Insights
            </h2>
            {insights && (
              <span
                className={`font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  CONFIDENCE_LABELS[insights.confidence].className
                }`}
              >
                {CONFIDENCE_LABELS[insights.confidence].label}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            Fetch publicly indexed Google &amp; LinkedIn highlights in real time
            to enrich skill alignment recommendations in the Career Advisor.
          </p>
        </div>

        {insights && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleFetchInsights()}
              disabled={isLoading}
              aria-label="Refresh real-time profile insights"
              className="min-h-[38px] px-3 rounded-[10px] border border-outline bg-surface-low hover:border-primary/50 text-xs font-medium text-ink inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleClearInsights}
              disabled={isLoading}
              aria-label="Clear saved profile insights"
              className="min-h-[38px] px-2.5 rounded-[10px] border border-outline bg-surface-low hover:border-tertiary/50 text-xs font-medium text-ink-secondary hover:text-tertiary inline-flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Query Form */}
      <form
        onSubmit={handleFetchInsights}
        className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end"
      >
        <div className="md:col-span-5 space-y-1">
          <label
            htmlFor="insights-linkedin-input"
            className="block text-[11px] font-semibold uppercase tracking-wide text-ink-secondary"
          >
            LinkedIn URL or Handle
          </label>
          <div className="relative">
            <Linkedin className="w-4 h-4 text-ink-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="insights-linkedin-input"
              type="text"
              value={linkedinInput}
              onChange={(e) => setLinkedinInput(e.target.value)}
              disabled={isLoading}
              placeholder="linkedin.com/in/your-handle"
              className="w-full min-h-[42px] pl-9 pr-3 rounded-xl border border-outline bg-surface-low text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-1">
          <label
            htmlFor="insights-name-input"
            className="block text-[11px] font-semibold uppercase tracking-wide text-ink-secondary"
          >
            Full Name (Optional with URL)
          </label>
          <input
            id="insights-name-input"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. Grace Namono"
            className="w-full min-h-[42px] px-3 rounded-xl border border-outline bg-surface-low text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isLoading || (!linkedinInput.trim() && nameInput.trim().length < 2)}
            className="w-full min-h-[42px] px-4 rounded-[10px] bg-primary hover:opacity-90 disabled:opacity-45 text-white dark:text-[#04261D] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-opacity whitespace-nowrap"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Fetch Live Insights
              </>
            )}
          </button>
        </div>
      </form>

      {/* Inline Error / Sync Notice */}
      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-tertiary/35 bg-tertiary-container/55 px-3.5 py-2.5 text-xs sm:text-sm text-on-tertiary-container flex items-start gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {syncNotice && (
        <div
          role="status"
          className="rounded-xl border border-primary/30 bg-primary-container/50 px-3.5 py-2.5 text-xs sm:text-sm text-on-primary-container flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Loaded Insights Card */}
      {insights && (
        <div className="rounded-xl border border-outline bg-surface-low p-4 space-y-4">
          {/* Headline & Summary */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {insights.headline ? (
                <h3 className="font-display text-sm sm:text-base font-semibold text-ink">
                  {insights.headline}
                </h3>
              ) : (
                <h3 className="font-display text-sm font-semibold text-ink">
                  Real-Time Web Summary
                </h3>
              )}
              {formattedFetchedTime && (
                <span className="font-mono text-[11px] text-ink-secondary">
                  Updated {formattedFetchedTime}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {insights.summary}
            </p>
          </div>

          {/* Discovered Skills + One-Click Sync */}
          {insights.extractedSkills.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-outline">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink">
                  Skills Detected from Public Profile ({insights.extractedSkills.length})
                </span>
                {newDiscoveredSkills.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleSyncSkills}
                    className="min-h-[34px] px-3 rounded-[10px] bg-primary text-white dark:text-[#04261D] hover:opacity-90 text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Sync {newDiscoveredSkills.length} New{" "}
                    {newDiscoveredSkills.length === 1 ? "Skill" : "Skills"} to Profile
                  </button>
                ) : (
                  <span className="font-mono text-[11px] text-strong inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    All synced to profile
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {insights.extractedSkills.map((skill) => {
                  const isSaved = savedSkillSet.has(skill.trim().toLowerCase());
                  return (
                    <span
                      key={skill}
                      className={`text-xs px-2.5 py-1 rounded-[10px] border inline-flex items-center gap-1 ${
                        isSaved
                          ? "bg-primary-container/60 border-primary/30 text-on-primary-container font-medium"
                          : "bg-surface border-outline text-ink"
                      }`}
                    >
                      {isSaved && <Check className="w-3 h-3" />}
                      {skill}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Experience & Education Highlights */}
          {(insights.experienceHighlights.length > 0 ||
            insights.educationHighlights.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-outline">
              {insights.experienceHighlights.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-ink inline-flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    Experience Highlights
                  </h4>
                  <ul className="space-y-1 text-xs text-ink-secondary list-disc pl-4">
                    {insights.experienceHighlights.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {insights.educationHighlights.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-ink inline-flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    Education &amp; Credentials
                  </h4>
                  <ul className="space-y-1 text-xs text-ink-secondary list-disc pl-4">
                    {insights.educationHighlights.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Alignment Impact Note */}
          {insights.alignmentNotes && (
            <div className="rounded-lg bg-surface border border-outline/80 px-3 py-2 text-xs text-ink-secondary leading-relaxed">
              <strong className="text-ink">Alignment Impact: </strong>
              {insights.alignmentNotes}
            </div>
          )}

          {/* Real-Time Grounding Sources */}
          {insights.sources.length > 0 && (
            <div className="pt-2 border-t border-outline space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-secondary">
                Google Real-Time Grounding Sources
              </span>
              <div className="flex flex-wrap gap-2">
                {insights.sources.map((src) => (
                  <a
                    key={src.uri}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 bg-surface border border-outline rounded-[10px] px-2.5 py-1 max-w-[260px]"
                  >
                    <span className="truncate">{src.title}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
