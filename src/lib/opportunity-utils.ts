import {
  Opportunity,
  OpportunityCategory,
  OpportunityRegion,
  OpportunityTracking,
  SortMode,
  TrackerFilter,
  UgandaRegion,
} from "@/types";
import { UGANDA_CITIES_BY_REGION, UGANDA_REGIONS } from "./seed-data";

export interface SkillAlignmentResult {
  percentage: number | null;
  matched: string[];
  missing: string[];
  matchedCount: number;
  totalCount: number;
  tier: "strong" | "moderate" | "gap" | "unscored";
}

export interface DeadlineInfo {
  daysLeft: number | null;
  isUrgent: boolean;
  isExpired: boolean;
  label: string;
}

export interface OpportunityFilterOptions {
  searchQuery: string;
  tracker: TrackerFilter;
  category: "All" | OpportunityCategory;
  region: UgandaRegion;
  city: string; // "All" or city name
  urgentOnly?: boolean;
  topMatchOnly?: boolean;
  sortMode: SortMode;
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function skillsMatch(studentSkill: string, requirement: string): boolean {
  const s = normalizeToken(studentSkill);
  const r = normalizeToken(requirement);
  if (!s || !r) return false;
  if (s === r) return true;
  if (s.length >= 2 && r.includes(s)) return true;
  if (r.length >= 2 && s.includes(r)) return true;

  // Token overlap for multi-word requirements like "React & TypeScript" or "REST APIs"
  const sTokens = s.split(" ").filter((t) => t.length >= 2);
  const rTokens = r.split(" ").filter((t) => t.length >= 2);
  return sTokens.some((st) => rTokens.some((rt) => st === rt));
}

/**
 * Calculates how well a student's saved skills align with an opportunity's requirements.
 */
export function calculateSkillAlignment(
  studentSkills: string[],
  requirements: string[]
): SkillAlignmentResult {
  const cleanReqs = requirements.map((r) => r.trim()).filter(Boolean);
  const cleanSkills = studentSkills.map((s) => s.trim()).filter(Boolean);

  if (cleanReqs.length === 0) {
    return {
      percentage: null,
      matched: [],
      missing: [],
      matchedCount: 0,
      totalCount: 0,
      tier: "unscored",
    };
  }

  if (cleanSkills.length === 0) {
    return {
      percentage: null,
      matched: [],
      missing: cleanReqs,
      matchedCount: 0,
      totalCount: cleanReqs.length,
      tier: "unscored",
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const req of cleanReqs) {
    const isHit = cleanSkills.some((skill) => skillsMatch(skill, req));
    if (isHit) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  const percentage = Math.round((matched.length / cleanReqs.length) * 100);
  const tier =
    percentage >= 70 ? "strong" : percentage >= 40 ? "moderate" : "gap";

  return {
    percentage,
    matched,
    missing,
    matchedCount: matched.length,
    totalCount: cleanReqs.length,
    tier,
  };
}

/**
 * Maps a location or city string to a canonical Uganda region.
 */
export function inferRegionFromLocation(
  location: string,
  city?: string
): OpportunityRegion {
  const haystack = `${city || ""} ${location || ""}`.toLowerCase();

  if (
    haystack.includes("remote") ||
    haystack.includes("online") ||
    haystack.includes("nationwide") ||
    haystack.includes("all uganda") ||
    haystack.includes("all africa")
  ) {
    return "Nationwide";
  }

  for (const region of UGANDA_REGIONS) {
    if (region === "Nationwide") continue;
    if (haystack.includes(region.toLowerCase())) {
      return region;
    }
    const cities = UGANDA_CITIES_BY_REGION[region];
    if (cities.some((c) => haystack.includes(c.toLowerCase()))) {
      return region;
    }
  }

  return "Nationwide";
}

/**
 * Computes days remaining and urgency status for an ISO YYYY-MM-DD deadline.
 */
export function getDeadlineInfo(
  deadline: string | null,
  referenceDate: Date = new Date()
): DeadlineInfo {
  if (!deadline || !deadline.trim()) {
    return {
      daysLeft: null,
      isUrgent: false,
      isExpired: false,
      label: "Rolling / Not listed",
    };
  }

  const parsed = new Date(`${deadline.slice(0, 10)}T23:59:59`);
  if (Number.isNaN(parsed.getTime())) {
    return {
      daysLeft: null,
      isUrgent: false,
      isExpired: false,
      label: deadline,
    };
  }

  const refStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const targetStart = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate()
  );

  const diffDays = Math.round(
    (targetStart.getTime() - refStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      daysLeft: diffDays,
      isUrgent: false,
      isExpired: true,
      label: "Closed",
    };
  }

  if (diffDays === 0) {
    return {
      daysLeft: 0,
      isUrgent: true,
      isExpired: false,
      label: "Closes today",
    };
  }

  if (diffDays === 1) {
    return {
      daysLeft: 1,
      isUrgent: true,
      isExpired: false,
      label: "1 day left",
    };
  }

  if (diffDays <= 7) {
    return {
      daysLeft: diffDays,
      isUrgent: true,
      isExpired: false,
      label: `${diffDays} days left`,
    };
  }

  return {
    daysLeft: diffDays,
    isUrgent: false,
    isExpired: false,
    label: deadline.slice(0, 10),
  };
}

/**
 * Counts opportunities per Uganda region for live region filter badges.
 */
export function computeRegionCounts(
  opportunities: Opportunity[]
): Record<UgandaRegion, number> {
  const counts: Record<UgandaRegion, number> = {
    "All Uganda": opportunities.length,
    Central: 0,
    Western: 0,
    Eastern: 0,
    Northern: 0,
    Nationwide: 0,
  };

  for (const opp of opportunities) {
    const region = opp.region || inferRegionFromLocation(opp.location, opp.city);
    counts[region] = (counts[region] || 0) + 1;
  }

  return counts;
}

/**
 * Filters and sorts opportunities based on search, tracker, category, Uganda region/city, and sort mode.
 */
export function filterAndSortOpportunities(
  opportunities: Opportunity[],
  trackingMap: Record<string, OpportunityTracking>,
  studentSkills: string[],
  filters: OpportunityFilterOptions,
  referenceDate: Date = new Date()
): Opportunity[] {
  const q = filters.searchQuery.trim().toLowerCase();

  const filtered = opportunities.filter((opp) => {
    const tracking = trackingMap[opp.id];
    const isSaved = Boolean(tracking?.saved || tracking?.status === "Saved");
    const isApplied = Boolean(
      tracking &&
        (tracking.status === "Applied" ||
          tracking.status === "Interview" ||
          tracking.status === "Accepted")
    );

    if (filters.tracker === "saved" && !isSaved) return false;
    if (filters.tracker === "applied" && !isApplied) return false;
    if (filters.tracker === "imported" && opp.is_verified) return false;

    if (filters.category !== "All" && opp.category !== filters.category) {
      return false;
    }

    const oppRegion = opp.region || inferRegionFromLocation(opp.location, opp.city);
    if (filters.region !== "All Uganda" && oppRegion !== filters.region) {
      return false;
    }

    if (filters.city && filters.city !== "All") {
      const targetCity = filters.city.toLowerCase();
      const oppCity = (opp.city || "").toLowerCase();
      const oppLocation = (opp.location || "").toLowerCase();
      if (!oppCity.includes(targetCity) && !oppLocation.includes(targetCity)) {
        return false;
      }
    }

    if (filters.urgentOnly) {
      const info = getDeadlineInfo(opp.deadline, referenceDate);
      if (!info.isUrgent) return false;
    }

    if (filters.topMatchOnly) {
      const alignment = calculateSkillAlignment(studentSkills, opp.requirements);
      if (alignment.percentage === null || alignment.percentage < 50) return false;
    }

    if (q) {
      const haystack = [
        opp.title,
        opp.organization,
        opp.city,
        opp.location,
        opp.region,
        opp.category,
        opp.summary,
        ...opp.requirements,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sortMode === "best_match") {
      const scoreA = calculateSkillAlignment(studentSkills, a.requirements).percentage ?? -1;
      const scoreB = calculateSkillAlignment(studentSkills, b.requirements).percentage ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      // Tie-break by earliest upcoming deadline
      const da = getDeadlineInfo(a.deadline, referenceDate).daysLeft ?? 9999;
      const db = getDeadlineInfo(b.deadline, referenceDate).daysLeft ?? 9999;
      return da - db;
    }

    if (filters.sortMode === "earliest_deadline") {
      const infoA = getDeadlineInfo(a.deadline, referenceDate);
      const infoB = getDeadlineInfo(b.deadline, referenceDate);
      const valA = infoA.isExpired ? 99999 : infoA.daysLeft ?? 50000;
      const valB = infoB.isExpired ? 99999 : infoB.daysLeft ?? 50000;
      return valA - valB;
    }

    // Sort by region then city then title
    const regionCmp = (a.region || "").localeCompare(b.region || "");
    if (regionCmp !== 0) return regionCmp;
    const cityCmp = (a.city || "").localeCompare(b.city || "");
    if (cityCmp !== 0) return cityCmp;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Finds IDs of workspace opportunities cited in an advisor response string.
 */
export function extractCitedOpportunityIds(
  responseText: string,
  opportunities: Opportunity[]
): string[] {
  const lower = responseText.toLowerCase();
  const cited: string[] = [];

  for (const opp of opportunities) {
    const titleLower = opp.title.trim().toLowerCase();
    const orgLower = opp.organization.trim().toLowerCase();
    if (
      (titleLower.length >= 4 && lower.includes(titleLower)) ||
      (orgLower.length >= 3 && lower.includes(orgLower))
    ) {
      cited.push(opp.id);
    }
  }

  return cited;
}
