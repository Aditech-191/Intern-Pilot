"use client";

import React, { useState } from "react";
import {
  FileText,
  PenLine,
  Loader2,
  AlertCircle,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  ExtractedOpportunityData,
  Opportunity,
  OpportunityCategory,
  OpportunityRegion,
} from "@/types";
import { UGANDA_CITIES_BY_REGION, UGANDA_REGIONS } from "@/lib/seed-data";
import { inferRegionFromLocation } from "@/lib/opportunity-utils";

interface ParsePostViewProps {
  onSaveOpportunity: (
    opp: Omit<Opportunity, "id" | "created_at">
  ) => void;
}

const CATEGORIES: OpportunityCategory[] = [
  "Internship",
  "Scholarship",
  "Fellowship",
  "Graduate Trainee",
];

function emptyDraft(): ExtractedOpportunityData {
  return {
    title: "",
    organization: "",
    category: "Internship",
    region: "Central",
    city: "Kampala",
    location: "",
    deadline: "",
    stipend: "",
    eligibility: "",
    requirements: [],
    link: "",
    summary: "",
    warnings: [],
  };
}

export function ParsePostView({ onSaveOpportunity }: ParsePostViewProps) {
  const [entryMode, setEntryMode] = useState<"paste" | "manual">("paste");
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [draft, setDraft] = useState<ExtractedOpportunityData | null>(null);
  const [newReq, setNewReq] = useState("");
  const [validationError, setValidationError] = useState("");

  const activeDraft = entryMode === "manual" ? draft ?? emptyDraft() : draft;

  const handleModeSwitch = (mode: "paste" | "manual") => {
    setEntryMode(mode);
    setErrorMsg("");
    setValidationError("");
    if (mode === "manual" && !draft) {
      setDraft(emptyDraft());
    }
  };

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setValidationError("");

    if (rawText.trim().length < 10) {
      setErrorMsg(
        "Paste at least 10 characters of an internship or scholarship announcement."
      );
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/gemini/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(
          json.error ||
            "Could not extract details automatically. You can switch to Manual Entry to add this listing."
        );
        return;
      }

      if (json.data) {
        setDraft({
          ...json.data,
          deadline: json.data.deadline || "",
          stipend: json.data.stipend || "",
          link: json.data.link || "",
        });
      }
    } catch {
      setErrorMsg(
        "Network error while contacting the parser. Switch to Manual Entry to add your opportunity directly."
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const updateDraftField = <K extends keyof ExtractedOpportunityData>(
    key: K,
    value: ExtractedOpportunityData[K]
  ) => {
    setDraft((prev) => {
      const base = prev ?? emptyDraft();
      const updated = { ...base, [key]: value };
      if (key === "region") {
        const regionCities = UGANDA_CITIES_BY_REGION[value as OpportunityRegion];
        if (regionCities && !regionCities.includes(updated.city)) {
          updated.city = regionCities[0] || "";
        }
      }
      return updated;
    });
  };

  const handleAddRequirement = () => {
    const clean = newReq.trim();
    if (!clean) return;
    const base = activeDraft ?? emptyDraft();
    if (!base.requirements.includes(clean)) {
      updateDraftField("requirements", [...base.requirements, clean]);
    }
    setNewReq("");
  };

  const handleRemoveRequirement = (req: string) => {
    const base = activeDraft ?? emptyDraft();
    updateDraftField(
      "requirements",
      base.requirements.filter((item) => item !== req)
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const current = activeDraft;
    if (!current) return;

    if (!current.title.trim()) {
      setValidationError("Please enter an opportunity title before saving.");
      return;
    }
    if (!current.organization.trim()) {
      setValidationError(
        "Please enter the host organization before saving."
      );
      return;
    }

    const cleanLocation =
      current.location.trim() ||
      (current.city ? `${current.city}, Uganda` : "Uganda");
    const resolvedRegion =
      current.region || inferRegionFromLocation(cleanLocation, current.city);

    const cleanLink = current.link?.trim() || null;
    if (cleanLink && !/^https?:\/\//i.test(cleanLink)) {
      setValidationError(
        "Application URL must start with https:// or http:// (or leave blank)."
      );
      return;
    }

    onSaveOpportunity({
      title: current.title.trim(),
      organization: current.organization.trim(),
      category: current.category,
      region: resolvedRegion,
      city: current.city.trim() || "Kampala",
      location: cleanLocation,
      deadline: current.deadline?.trim() || null,
      stipend: current.stipend?.trim() || null,
      eligibility: current.eligibility.trim() || "Not listed",
      requirements: current.requirements,
      link: cleanLink,
      summary: current.summary.trim(),
      is_verified: false,
      source: entryMode === "paste" ? "parsed" : "manual",
      warnings: current.warnings || [],
    });

    setRawText("");
    setDraft(null);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Add &amp; Parse Opportunity
          </h1>
          <p className="text-sm text-ink-secondary mt-1 max-w-2xl">
            Paste a messy WhatsApp forward, university notice, or LinkedIn post
            to turn it into a structured card—or enter an opportunity directly.
          </p>
        </div>

        {/* Segmented Mode Control */}
        <div
          role="tablist"
          aria-label="Entry mode"
          className="inline-flex p-1 rounded-[12px] bg-surface border border-outline self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={entryMode === "paste"}
            onClick={() => handleModeSwitch("paste")}
            className={`min-h-[40px] px-3.5 rounded-[9px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              entryMode === "paste"
                ? "bg-primary text-white dark:text-[#04261D]"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Forward
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={entryMode === "manual"}
            onClick={() => handleModeSwitch("manual")}
            className={`min-h-[40px] px-3.5 rounded-[9px] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              entryMode === "manual"
                ? "bg-primary text-white dark:text-[#04261D]"
                : "text-ink-secondary hover:text-ink"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            Add Manually
          </button>
        </div>
      </div>

      {/* Paste Forward Panel */}
      {entryMode === "paste" && (
        <form
          onSubmit={handleExtract}
          className="rounded-2xl border border-outline bg-surface p-5 sm:p-6 space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="raw-opportunity-input"
              className="block text-sm font-semibold text-ink"
            >
              Paste announcement text
            </label>
            <textarea
              id="raw-opportunity-input"
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the full WhatsApp message, LinkedIn post, or email here (including organization, location in Uganda, deadline, skills required, and application link)..."
              className="w-full rounded-xl border border-outline bg-surface-low px-4 py-3 text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-tertiary-container/60 border border-tertiary/35 text-on-tertiary-container text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => handleModeSwitch("manual")}
                  className="font-semibold underline underline-offset-2"
                >
                  Open Manual Entry form instead
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-secondary">
              Imported entries are labeled <strong>Imported</strong> until you
              verify their official source.
            </p>

            <button
              type="submit"
              disabled={isExtracting}
              className="min-h-[44px] px-5 py-2.5 rounded-[10px] bg-primary hover:opacity-90 disabled:opacity-60 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting structure...
                </>
              ) : (
                "Extract Structured Card"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Editable Structured Card Form (appears after extraction OR immediately in Manual Mode) */}
      {activeDraft && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-outline bg-surface p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                {entryMode === "paste"
                  ? "Review & Edit Extracted Details"
                  : "Opportunity Details"}
              </h2>
              <p className="text-xs text-ink-secondary mt-0.5">
                Verify all fields before saving to your Discover feed.
              </p>
            </div>
          </div>

          {activeDraft.warnings && activeDraft.warnings.length > 0 && (
            <div className="p-3.5 rounded-xl bg-secondary-container/60 border border-secondary/35 text-on-secondary-container text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Verification &amp; Safety Notices
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {activeDraft.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {validationError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-tertiary-container/60 border border-tertiary/35 text-on-tertiary-container text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="opp-title"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Opportunity Title *
              </label>
              <input
                id="opp-title"
                type="text"
                required
                value={activeDraft.title}
                onChange={(e) => updateDraftField("title", e.target.value)}
                placeholder="e.g. Software Engineering Intern"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-org"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Organization *
              </label>
              <input
                id="opp-org"
                type="text"
                required
                value={activeDraft.organization}
                onChange={(e) =>
                  updateDraftField("organization", e.target.value)
                }
                placeholder="e.g. Organization or institution name"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-category"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Category
              </label>
              <select
                id="opp-category"
                value={activeDraft.category}
                onChange={(e) =>
                  updateDraftField(
                    "category",
                    e.target.value as OpportunityCategory
                  )
                }
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-deadline"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Application Deadline
              </label>
              <input
                id="opp-deadline"
                type="date"
                value={activeDraft.deadline || ""}
                onChange={(e) => updateDraftField("deadline", e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm font-mono text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-region"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Uganda Region
              </label>
              <select
                id="opp-region"
                value={activeDraft.region}
                onChange={(e) =>
                  updateDraftField(
                    "region",
                    e.target.value as OpportunityRegion
                  )
                }
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {UGANDA_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-city"
                className="block text-xs font-semibold text-ink-secondary"
              >
                City / Town
              </label>
              <select
                id="opp-city"
                value={activeDraft.city}
                onChange={(e) => updateDraftField("city", e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {(UGANDA_CITIES_BY_REGION[activeDraft.region] || []).map(
                  (city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-stipend"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Stipend / Scholarship Value (optional)
              </label>
              <input
                id="opp-stipend"
                type="text"
                value={activeDraft.stipend || ""}
                onChange={(e) => updateDraftField("stipend", e.target.value)}
                placeholder="e.g. UGX 600,000 / month or Full Tuition"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="opp-link"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Official Application URL (optional)
              </label>
              <input
                id="opp-link"
                type="url"
                value={activeDraft.link || ""}
                onChange={(e) => updateDraftField("link", e.target.value)}
                placeholder="https://..."
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="opp-eligibility"
              className="block text-xs font-semibold text-ink-secondary"
            >
              Eligibility Criteria
            </label>
            <input
              id="opp-eligibility"
              type="text"
              value={activeDraft.eligibility}
              onChange={(e) => updateDraftField("eligibility", e.target.value)}
              placeholder="e.g. Year 2 or Year 3 undergraduate students in Computing or Engineering"
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="opp-req-input"
              className="block text-xs font-semibold text-ink-secondary"
            >
              Required Skills &amp; Qualifications
            </label>
            <div className="flex gap-2">
              <input
                id="opp-req-input"
                type="text"
                value={newReq}
                onChange={(e) => setNewReq(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRequirement();
                  }
                }}
                placeholder="Add a required skill (e.g. Python, AutoCAD, SQL) and press Enter"
                className="flex-1 min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                aria-label="Add requirement"
                className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-primary-container hover:text-on-primary-container text-sm font-medium text-ink inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {activeDraft.requirements.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {activeDraft.requirements.map((req) => (
                  <span
                    key={req}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-surface-low border border-outline text-xs font-medium text-ink"
                  >
                    {req}
                    <button
                      type="button"
                      onClick={() => handleRemoveRequirement(req)}
                      aria-label={`Remove requirement ${req}`}
                      className="text-ink-secondary hover:text-urgent"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="opp-summary"
              className="block text-xs font-semibold text-ink-secondary"
            >
              Summary
            </label>
            <textarea
              id="opp-summary"
              rows={3}
              value={activeDraft.summary}
              onChange={(e) => updateDraftField("summary", e.target.value)}
              placeholder="Short factual summary of the role or scholarship..."
              className="w-full rounded-xl border border-outline bg-surface-low px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline">
            <button
              type="button"
              onClick={() => {
                setDraft(entryMode === "manual" ? emptyDraft() : null);
                setValidationError("");
              }}
              className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface text-sm font-medium text-ink-secondary hover:text-ink"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save to Discover
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
