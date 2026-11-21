"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  FilePlus2,
  UserPen,
  RotateCcw,
  Inbox,
} from "lucide-react";
import {
  Opportunity,
  OpportunityCategory,
  OpportunityTracking,
  SortMode,
  StudentProfile,
  TrackerFilter,
  UgandaRegion,
} from "@/types";
import { createBlankProfile } from "@/lib/seed-data";
import {
  calculateSkillAlignment,
  computeRegionCounts,
  filterAndSortOpportunities,
  getDeadlineInfo,
} from "@/lib/opportunity-utils";
import {
  WorkspaceBackupPayload,
  mergeWorkspaceData,
} from "@/lib/profile-portability";
import {
  CrestPathTab,
  NavigationShell,
} from "@/components/crestpath/NavigationShell";
import { DiscoverHero } from "@/components/crestpath/DiscoverHero";
import {
  KpiFilterKey,
  KpiMetricStrip,
} from "@/components/crestpath/KpiMetricStrip";
import { RegionCityFilter } from "@/components/crestpath/RegionCityFilter";
import { OpportunityCard } from "@/components/crestpath/OpportunityCard";
import { OpportunityDetailInspector } from "@/components/crestpath/OpportunityDetailInspector";
import { ParsePostView } from "@/components/crestpath/ParsePostView";
import { CareerAdvisorView } from "@/components/crestpath/CareerAdvisorView";
import { ProfileSettingsView } from "@/components/crestpath/ProfileSettingsView";
import { UniversityCampusStrip } from "@/components/crestpath/UniversityCampusStrip";

const STORAGE_OPPS = "crestpath_opportunities_v1";
const STORAGE_TRACKING = "crestpath_tracking_v1";
const STORAGE_PROFILES = "crestpath_profiles_v1";
const STORAGE_ACTIVE_PROFILE = "crestpath_active_profile_v1";
const STORAGE_UNI_PHOTOS = "internpilot_university_photos_v1";

const TRACKER_OPTIONS: Array<{ value: TrackerFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "imported", label: "Imported" },
];

const CATEGORY_OPTIONS: Array<"All" | OpportunityCategory> = [
  "All",
  "Internship",
  "Scholarship",
  "Fellowship",
  "Graduate Trainee",
];

const SORT_CYCLE: SortMode[] = ["best_match", "earliest_deadline", "region"];

const SORT_LABELS: Record<SortMode, string> = {
  best_match: "Best Match",
  earliest_deadline: "Earliest Deadline",
  region: "Region / City",
};

export default function CrestPathWorkspacePage() {
  const [activeTab, setActiveTab] = useState<CrestPathTab>("discover");
  const [hydrated, setHydrated] = useState(false);

  // Strictly empty initial state: zero dummy opportunities, zero fake profiles
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [trackingMap, setTrackingMap] = useState<
    Record<string, OpportunityTracking>
  >({});
  const [profiles, setProfiles] = useState<StudentProfile[]>(() => [
    createBlankProfile("profile-primary"),
  ]);
  const [activeProfileId, setActiveProfileId] =
    useState<string>("profile-primary");
  const [customUniversityPhotos, setCustomUniversityPhotos] = useState<
    Record<string, string>
  >({});
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  // Discover filters & detail inspector state
  const [searchQuery, setSearchQuery] = useState("");
  const [trackerFilter, setTrackerFilter] = useState<TrackerFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<
    "All" | OpportunityCategory
  >("All");
  const [selectedRegion, setSelectedRegion] =
    useState<UgandaRegion>("All Uganda");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [sortMode, setSortMode] = useState<SortMode>("best_match");
  const [activeKpi, setActiveKpi] = useState<KpiFilterKey | null>(null);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    string | null
  >(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Load persisted user-inputted data from localStorage + check auth session
  useEffect(() => {
    try {
      const storedOpps = localStorage.getItem(STORAGE_OPPS);
      if (storedOpps) {
        const parsed = JSON.parse(storedOpps);
        if (Array.isArray(parsed)) setOpportunities(parsed);
      }

      const storedTracking = localStorage.getItem(STORAGE_TRACKING);
      if (storedTracking) {
        const parsed = JSON.parse(storedTracking);
        if (parsed && typeof parsed === "object") setTrackingMap(parsed);
      }

      const storedProfiles = localStorage.getItem(STORAGE_PROFILES);
      if (storedProfiles) {
        const parsed = JSON.parse(storedProfiles);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed);
          const storedActive = localStorage.getItem(STORAGE_ACTIVE_PROFILE);
          if (
            storedActive &&
            parsed.some((p: StudentProfile) => p.id === storedActive)
          ) {
            setActiveProfileId(storedActive);
          } else {
            setActiveProfileId(parsed[0].id);
          }
        }
      }

      const storedUniPhotos = localStorage.getItem(STORAGE_UNI_PHOTOS);
      if (storedUniPhotos) {
        const parsed = JSON.parse(storedUniPhotos);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setCustomUniversityPhotos(parsed);
        }
      }
    } catch {
      // Ignore malformed localStorage entries
    } finally {
      setHydrated(true);
    }

    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.session?.email) {
          setSessionEmail(data.session.email);
          setProfiles((prev) =>
            prev.map((p, idx) =>
              idx === 0 && !p.name.trim() && !p.email
                ? {
                    ...p,
                    name: data.session.name || "",
                    email: data.session.email,
                  }
                : p
            )
          );
        }
      })
      .catch(() => {
        // Ignore session check failure
      });
  }, []);

  // Persist user-inputted workspace changes
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_OPPS, JSON.stringify(opportunities));
  }, [opportunities, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_TRACKING, JSON.stringify(trackingMap));
  }, [trackingMap, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
    localStorage.setItem(STORAGE_ACTIVE_PROFILE, activeProfileId);
  }, [profiles, activeProfileId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_UNI_PHOTOS,
      JSON.stringify(customUniversityPhotos)
    );
  }, [customUniversityPhotos, hydrated]);

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || profiles[0],
    [profiles, activeProfileId]
  );

  // KPI Metrics computed strictly from user-inputted opportunities
  const metrics = useMemo(() => {
    let topMatches = 0;
    let saved = 0;
    let applied = 0;
    let closingSoon = 0;

    for (const opp of opportunities) {
      const alignment = calculateSkillAlignment(
        activeProfile.skills,
        opp.requirements
      );
      if (alignment.percentage !== null && alignment.percentage >= 50) {
        topMatches += 1;
      }

      const t = trackingMap[opp.id];
      if (t?.saved || t?.status === "Saved") saved += 1;
      if (
        t &&
        (t.status === "Applied" ||
          t.status === "Interview" ||
          t.status === "Accepted")
      ) {
        applied += 1;
      }

      if (getDeadlineInfo(opp.deadline).isUrgent) {
        closingSoon += 1;
      }
    }

    return { topMatches, saved, applied, closingSoon };
  }, [opportunities, activeProfile.skills, trackingMap]);

  const regionCounts = useMemo(
    () => computeRegionCounts(opportunities),
    [opportunities]
  );

  const filteredOpportunities = useMemo(
    () =>
      filterAndSortOpportunities(
        opportunities,
        trackingMap,
        activeProfile.skills,
        {
          searchQuery,
          tracker: trackerFilter,
          category: categoryFilter,
          region: selectedRegion,
          city: selectedCity,
          urgentOnly: activeKpi === "closing_soon",
          topMatchOnly: activeKpi === "top_matches",
          sortMode,
        }
      ),
    [
      opportunities,
      trackingMap,
      activeProfile.skills,
      searchQuery,
      trackerFilter,
      categoryFilter,
      selectedRegion,
      selectedCity,
      activeKpi,
      sortMode,
    ]
  );

  const selectedOpportunity = useMemo(() => {
    if (selectedOpportunityId) {
      const found = filteredOpportunities.find(
        (o) => o.id === selectedOpportunityId
      );
      if (found) return found;
      const anyFound = opportunities.find((o) => o.id === selectedOpportunityId);
      if (anyFound) return anyFound;
    }
    return filteredOpportunities[0] || null;
  }, [selectedOpportunityId, filteredOpportunities, opportunities]);

  const handleUpdateTracking = (
    id: string,
    patch: Partial<OpportunityTracking>
  ) => {
    setTrackingMap((prev) => {
      const current: OpportunityTracking = prev[id] || {
        status: "Not Started",
        saved: false,
        notes: "",
        checkedRequirements: [],
      };
      return {
        ...prev,
        [id]: { ...current, ...patch },
      };
    });
  };

  const handleToggleSave = (id: string) => {
    setSelectedOpportunityId(id);
    const current = trackingMap[id];
    const nextSaved = !Boolean(current?.saved || current?.status === "Saved");
    handleUpdateTracking(id, {
      saved: nextSaved,
      status:
        nextSaved && (!current || current.status === "Not Started")
          ? "Saved"
          : !nextSaved && current?.status === "Saved"
          ? "Not Started"
          : current?.status || "Not Started",
    });
  };

  const handleToggleApplied = (id: string) => {
    setSelectedOpportunityId(id);
    const current = trackingMap[id];
    const alreadyApplied =
      current?.status === "Applied" ||
      current?.status === "Interview" ||
      current?.status === "Accepted";
    handleUpdateTracking(id, {
      status: alreadyApplied ? (current?.saved ? "Saved" : "Not Started") : "Applied",
    });
  };

  const handleToggleVerified = (id: string) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === id ? { ...opp, is_verified: !opp.is_verified } : opp
      )
    );
  };

  const handleDeleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    setTrackingMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    if (selectedOpportunityId === id) {
      setSelectedOpportunityId(null);
      setIsMobileDetailOpen(false);
    }
  };

  const handleSaveNewOpportunity = (
    newOpp: Omit<Opportunity, "id" | "created_at">
  ) => {
    const created: Opportunity = {
      ...newOpp,
      id: `opp-${Date.now()}`,
      created_at: new Date().toISOString().split("T")[0],
    };
    setOpportunities((prev) => [created, ...prev]);
    setSelectedOpportunityId(created.id);
    setActiveTab("discover");
  };

  const handleSelectKpi = (key: KpiFilterKey) => {
    if (activeKpi === key) {
      setActiveKpi(null);
      setTrackerFilter("all");
      return;
    }
    setActiveKpi(key);
    if (key === "saved") {
      setTrackerFilter("saved");
    } else if (key === "applied") {
      setTrackerFilter("applied");
    } else if (key === "closing_soon") {
      setTrackerFilter("all");
      setSortMode("earliest_deadline");
    } else if (key === "top_matches") {
      setTrackerFilter("all");
      setSortMode("best_match");
    }
  };

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setTrackerFilter("all");
    setCategoryFilter("All");
    setSelectedRegion("All Uganda");
    setSelectedCity("All");
    setActiveKpi(null);
    setSortMode("best_match");
  };

  const handleCycleSort = () => {
    const nextIdx = (SORT_CYCLE.indexOf(sortMode) + 1) % SORT_CYCLE.length;
    setSortMode(SORT_CYCLE[nextIdx]);
  };

  const handleSaveProfile = (updated: StudentProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleCreateProfile = () => {
    const created = createBlankProfile(`profile-${Date.now()}`);
    setProfiles((prev) => [...prev, created]);
    setActiveProfileId(created.id);
  };

  const handleImportWorkspace = (
    payload: WorkspaceBackupPayload,
    mode: "replace" | "merge"
  ) => {
    if (mode === "replace") {
      setOpportunities(payload.opportunities);
      setTrackingMap(payload.trackingMap);
      setProfiles(payload.profiles);
      setActiveProfileId(payload.activeProfileId);
      setSelectedOpportunityId(payload.opportunities[0]?.id ?? null);
    } else {
      const merged = mergeWorkspaceData(
        {
          profiles,
          activeProfileId,
          opportunities,
          trackingMap,
        },
        payload
      );
      setOpportunities(merged.opportunities);
      setTrackingMap(merged.trackingMap);
      setProfiles(merged.profiles);
      setActiveProfileId(merged.activeProfileId);
    }
    handleClearAllFilters();
  };

  const handleUploadUniversityPhoto = (university: string, dataUrl: string) => {
    const clean = university.trim();
    if (!clean) return;
    setCustomUniversityPhotos((prev) => ({ ...prev, [clean]: dataUrl }));
  };

  const handleRemoveUniversityPhoto = (university: string) => {
    const target = university.trim().toLowerCase();
    setCustomUniversityPhotos((prev) => {
      const next: Record<string, string> = {};
      for (const [key, val] of Object.entries(prev)) {
        if (key.trim().toLowerCase() !== target) {
          next[key] = val;
        }
      }
      return next;
    });
  };

  const handleResetWorkspace = () => {
    const fresh = createBlankProfile("profile-primary");
    setOpportunities([]);
    setTrackingMap({});
    setProfiles([fresh]);
    setActiveProfileId(fresh.id);
    setCustomUniversityPhotos({});
    setSelectedOpportunityId(null);
    setIsMobileDetailOpen(false);
    handleClearAllFilters();
    localStorage.removeItem(STORAGE_OPPS);
    localStorage.removeItem(STORAGE_TRACKING);
    localStorage.removeItem(STORAGE_PROFILES);
    localStorage.removeItem(STORAGE_ACTIVE_PROFILE);
    localStorage.removeItem(STORAGE_UNI_PHOTOS);
  };

  const handleInspectFromAdvisor = (opp: Opportunity) => {
    handleClearAllFilters();
    setSelectedOpportunityId(opp.id);
    setActiveTab("discover");
    setIsMobileDetailOpen(true);
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    trackerFilter !== "all" ||
    categoryFilter !== "All" ||
    selectedRegion !== "All Uganda" ||
    selectedCity !== "All" ||
    activeKpi !== null;

  return (
    <NavigationShell
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      opportunityCount={opportunities.length}
      profileName={activeProfile.name}
      profileAvatar={activeProfile.avatarDataUrl}
      sessionEmail={sessionEmail}
    >
      {activeTab === "discover" && (
        <div className="space-y-6">
          {/* Animated University Campus Hero */}
          <DiscoverHero
            profile={activeProfile}
            profileCount={profiles.length}
            customUniversityPhotos={customUniversityPhotos}
            onOpenParse={() => setActiveTab("parse")}
            onOpenProfile={() => setActiveTab("profile")}
          />

          {/* 4-Card Tappable KPI Metric Strip */}
          <KpiMetricStrip
            topMatchesCount={metrics.topMatches}
            savedCount={metrics.saved}
            appliedCount={metrics.applied}
            closingSoonCount={metrics.closingSoon}
            activeKpi={activeKpi}
            onSelectKpi={handleSelectKpi}
          />

          {/* Search, Tracker, Sort & Category Controls */}
          <section
            aria-label="Search and filter opportunities"
            className="space-y-3"
          >
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <label htmlFor="discover-search" className="sr-only">
                  Search opportunities
                </label>
                <input
                  id="discover-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search organization, title, skill, or Ugandan city..."
                  className="w-full min-h-[46px] pl-10 pr-4 rounded-2xl border border-outline bg-surface text-sm text-ink placeholder:text-ink-secondary/65 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="button"
                onClick={handleCycleSort}
                aria-label={`Sort opportunities, currently ${SORT_LABELS[sortMode]}`}
                className="min-h-[46px] px-4 rounded-2xl border border-outline bg-surface hover:bg-surface-low text-xs sm:text-sm font-medium text-ink inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ArrowUpDown className="w-4 h-4 text-primary" />
                <span>Sort: {SORT_LABELS[sortMode]}</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              {/* Tracker Segmented Buttons */}
              <div
                role="group"
                aria-label="Filter by tracking status"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
              >
                {TRACKER_OPTIONS.map((opt) => {
                  const isActive = trackerFilter === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setTrackerFilter(opt.value);
                        if (opt.value !== "saved" && opt.value !== "applied") {
                          setActiveKpi(null);
                        }
                      }}
                      aria-pressed={isActive}
                      className={`min-h-[40px] px-3.5 rounded-[10px] text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-primary text-white dark:text-[#04261D] border-primary font-semibold"
                          : "bg-surface text-ink-secondary border-outline hover:text-ink"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Category Filter Buttons */}
              <div
                role="group"
                aria-label="Filter by category"
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
              >
                {CATEGORY_OPTIONS.map((cat) => {
                  const isActive = categoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      aria-pressed={isActive}
                      className={`min-h-[40px] px-3 rounded-[10px] text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-secondary-container text-on-secondary-container border-secondary/40 font-semibold"
                          : "bg-surface text-ink-secondary border-outline hover:text-ink"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Uganda Region & City Filter Card */}
          <RegionCityFilter
            selectedRegion={selectedRegion}
            selectedCity={selectedCity}
            regionCounts={regionCounts}
            onSelectRegion={(region) => {
              setSelectedRegion(region);
              setSelectedCity("All");
            }}
            onSelectCity={setSelectedCity}
            onReset={() => {
              setSelectedRegion("All Uganda");
              setSelectedCity("All");
            }}
          />

          {/* Interactive Animated University Campus Strip above the Feed */}
          <UniversityCampusStrip
            activeUniversity={activeProfile.university}
            customUniversityPhotos={customUniversityPhotos}
            onUploadUniversityPhoto={handleUploadUniversityPhoto}
            onRemoveUniversityPhoto={handleRemoveUniversityPhoto}
          />

          {/* Main Split-Pane List-Detail Workspace */}
          {opportunities.length === 0 ? (
            <section
              aria-label="Empty workspace"
              className="rounded-2xl border border-outline bg-surface p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h2 className="font-display text-xl font-bold text-ink">
                  Your workspace starts clean
                </h2>
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Intern Pilot contains zero dummy listings. Paste a WhatsApp
                  forward or LinkedIn post—or enter an internship or scholarship
                  manually—to start tracking deadlines and skill alignment.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("parse")}
                  className="min-h-[44px] px-5 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 transition-opacity whitespace-nowrap"
                >
                  <FilePlus2 className="w-4 h-4" />
                  Paste or Add Opportunity
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-canvas text-sm font-medium text-ink inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <UserPen className="w-4 h-4 text-primary" />
                  Set Up My Skills
                </button>
              </div>
            </section>
          ) : filteredOpportunities.length === 0 ? (
            <section
              aria-label="No matching opportunities"
              className="rounded-2xl border border-outline bg-surface p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3"
            >
              <h2 className="font-display text-lg font-semibold text-ink">
                No opportunities match your active filters
              </h2>
              <p className="text-sm text-ink-secondary max-w-md">
                Try broadening your Uganda region, city, category, or search
                query to view your {opportunities.length} saved{" "}
                {opportunities.length === 1 ? "listing" : "listings"}.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="min-h-[44px] px-4 rounded-[10px] bg-primary text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </section>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Feed */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="flex items-center justify-between text-xs text-ink-secondary px-1">
                  <span className="font-mono tabular-nums">
                    Showing {filteredOpportunities.length} of{" "}
                    {opportunities.length}
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearAllFilters}
                      className="text-primary font-medium hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {filteredOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    studentSkills={activeProfile.skills}
                    tracking={trackingMap[opp.id]}
                    isSelected={selectedOpportunity?.id === opp.id}
                    onSelect={(selected) => {
                      setSelectedOpportunityId(selected.id);
                      setIsMobileDetailOpen(true);
                    }}
                    onToggleSave={handleToggleSave}
                    onToggleApplied={handleToggleApplied}
                  />
                ))}
              </div>

              {/* Right Pane: Sticky Desktop Opportunity Detail Inspector */}
              <div className="hidden lg:block lg:col-span-5">
                <OpportunityDetailInspector
                  opportunity={selectedOpportunity}
                  studentSkills={activeProfile.skills}
                  tracking={
                    selectedOpportunity
                      ? trackingMap[selectedOpportunity.id]
                      : undefined
                  }
                  onUpdateTracking={handleUpdateTracking}
                  onToggleVerified={handleToggleVerified}
                  onDeleteOpportunity={handleDeleteOpportunity}
                />
              </div>
            </div>
          )}

          {/* Mobile & Tablet Slide-Up Opportunity Detail Modal Sheet */}
          {isMobileDetailOpen && selectedOpportunity && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Details for ${selectedOpportunity.title}`}
              className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:p-4"
            >
              <div
                className="fixed inset-0"
                onClick={() => setIsMobileDetailOpen(false)}
                aria-hidden="true"
              />
              <div className="relative z-10 w-full max-w-xl">
                <OpportunityDetailInspector
                  opportunity={selectedOpportunity}
                  studentSkills={activeProfile.skills}
                  tracking={trackingMap[selectedOpportunity.id]}
                  onUpdateTracking={handleUpdateTracking}
                  onToggleVerified={handleToggleVerified}
                  onDeleteOpportunity={handleDeleteOpportunity}
                  onCloseMobile={() => setIsMobileDetailOpen(false)}
                  isMobileSheet
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "parse" && (
        <ParsePostView onSaveOpportunity={handleSaveNewOpportunity} />
      )}

      {activeTab === "advisor" && (
        <CareerAdvisorView
          profile={activeProfile}
          opportunities={opportunities}
          onInspectOpportunity={handleInspectFromAdvisor}
          onOpenParse={() => setActiveTab("parse")}
          onSaveProfile={handleSaveProfile}
        />
      )}

      {activeTab === "profile" && (
        <ProfileSettingsView
          profiles={profiles}
          activeProfile={activeProfile}
          opportunities={opportunities}
          trackingMap={trackingMap}
          customUniversityPhotos={customUniversityPhotos}
          sessionEmail={sessionEmail}
          onSaveProfile={handleSaveProfile}
          onSwitchProfile={setActiveProfileId}
          onCreateProfile={handleCreateProfile}
          onUploadUniversityPhoto={handleUploadUniversityPhoto}
          onRemoveUniversityPhoto={handleRemoveUniversityPhoto}
          onImportWorkspace={handleImportWorkspace}
          onResetWorkspace={handleResetWorkspace}
        />
      )}
    </NavigationShell>
  );
}
