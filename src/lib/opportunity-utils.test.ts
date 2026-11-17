import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSkillAlignment,
  computeRegionCounts,
  extractCitedOpportunityIds,
  filterAndSortOpportunities,
  getDeadlineInfo,
  inferRegionFromLocation,
} from "./opportunity-utils";
import { Opportunity, OpportunityTracking } from "../types";

const sampleOpportunities: Opportunity[] = [
  {
    id: "opp-1",
    title: "Backend Engineering Intern",
    organization: "Kampala FinLabs",
    location: "Kampala, Uganda",
    region: "Central",
    city: "Kampala",
    stipend: "UGX 800,000 / mo",
    deadline: "2026-11-20",
    eligibility: "Year 2-3 CS students",
    requirements: ["TypeScript", "Node.js", "PostgreSQL", "Git"],
    link: "https://example.ug/apply",
    summary: "Build payment APIs.",
    category: "Internship",
    is_verified: false,
    source: "manual",
    created_at: "2026-11-17",
  },
  {
    id: "opp-2",
    title: "Rural Health Data Fellowship",
    organization: "Mbarara Health Institute",
    location: "Mbarara, Western Uganda",
    region: "Western",
    city: "Mbarara",
    stipend: "Full Stipend",
    deadline: "2026-12-10",
    eligibility: "Public Health & CS students",
    requirements: ["Python", "Data Analysis", "SQL"],
    link: null,
    summary: "Analyze clinic datasets.",
    category: "Fellowship",
    is_verified: true,
    source: "parsed",
    created_at: "2026-11-17",
  },
  {
    id: "opp-3",
    title: "Northern AgriTech Scholarship",
    organization: "Gulu Innovation Trust",
    location: "Gulu, Uganda",
    region: "Northern",
    city: "Gulu",
    deadline: null,
    eligibility: "Undergraduate students in Northern Uganda",
    requirements: ["Python", "GIS", "Field Research"],
    link: "https://gulu.example.ug",
    summary: "Tuition grant for agritech researchers.",
    category: "Scholarship",
    is_verified: false,
    source: "parsed",
    created_at: "2026-11-17",
  },
];

test("calculateSkillAlignment handles strong, moderate, gap, and unscored states", () => {
  const strong = calculateSkillAlignment(
    ["TypeScript", "Node.js", "PostgreSQL"],
    ["TypeScript", "Node.js", "PostgreSQL", "Git"]
  );
  assert.equal(strong.percentage, 75);
  assert.equal(strong.matchedCount, 3);
  assert.equal(strong.totalCount, 4);
  assert.equal(strong.tier, "strong");
  assert.deepEqual(strong.missing, ["Git"]);

  const moderate = calculateSkillAlignment(
    ["Python", "SQL"],
    ["Python", "Data Analysis", "SQL", "R"]
  );
  assert.equal(moderate.percentage, 50);
  assert.equal(moderate.tier, "moderate");

  const gap = calculateSkillAlignment(["Figma"], ["Python", "SQL", "Docker"]);
  assert.equal(gap.percentage, 0);
  assert.equal(gap.tier, "gap");

  const unscored = calculateSkillAlignment([], ["Python", "SQL"]);
  assert.equal(unscored.percentage, null);
  assert.equal(unscored.tier, "unscored");
  assert.equal(unscored.missing.length, 2);
});

test("inferRegionFromLocation accurately maps Ugandan cities and remote listings", () => {
  assert.equal(inferRegionFromLocation("Plot 12 Kampala Road"), "Central");
  assert.equal(inferRegionFromLocation("Mbarara Town"), "Western");
  assert.equal(inferRegionFromLocation("Jinja Industrial Park"), "Eastern");
  assert.equal(inferRegionFromLocation("Gulu University Campus"), "Northern");
  assert.equal(inferRegionFromLocation("Remote across Uganda"), "Nationwide");
});

test("getDeadlineInfo computes days left, urgent flag, closed, and rolling states", () => {
  const ref = new Date("2026-11-17T10:00:00");
  const urgent = getDeadlineInfo("2026-11-20", ref);
  assert.equal(urgent.daysLeft, 3);
  assert.equal(urgent.isUrgent, true);
  assert.equal(urgent.isExpired, false);
  assert.equal(urgent.label, "3 days left");

  const closed = getDeadlineInfo("2026-11-15", ref);
  assert.equal(closed.isExpired, true);
  assert.equal(closed.isUrgent, false);
  assert.equal(closed.label, "Closed");

  const rolling = getDeadlineInfo(null, ref);
  assert.equal(rolling.daysLeft, null);
  assert.equal(rolling.label, "Rolling / Not listed");
});

test("computeRegionCounts and filterAndSortOpportunities filter by region, city, tracker, and sort", () => {
  const counts = computeRegionCounts(sampleOpportunities);
  assert.equal(counts["All Uganda"], 3);
  assert.equal(counts.Central, 1);
  assert.equal(counts.Western, 1);
  assert.equal(counts.Northern, 1);
  assert.equal(counts.Eastern, 0);

  const tracking: Record<string, OpportunityTracking> = {
    "opp-1": { status: "Applied", saved: true, notes: "", checkedRequirements: [] },
  };

  const westernOnly = filterAndSortOpportunities(
    sampleOpportunities,
    tracking,
    ["Python", "SQL"],
    {
      searchQuery: "",
      tracker: "all",
      category: "All",
      region: "Western",
      city: "Mbarara",
      sortMode: "best_match",
    },
    new Date("2026-11-17T10:00:00")
  );
  assert.equal(westernOnly.length, 1);
  assert.equal(westernOnly[0].id, "opp-2");

  const bestMatchAll = filterAndSortOpportunities(
    sampleOpportunities,
    tracking,
    ["Python", "SQL", "Data Analysis"],
    {
      searchQuery: "",
      tracker: "all",
      category: "All",
      region: "All Uganda",
      city: "All",
      sortMode: "best_match",
    },
    new Date("2026-11-17T10:00:00")
  );
  assert.equal(bestMatchAll[0].id, "opp-2"); // 100% match first
});

test("extractCitedOpportunityIds identifies opportunities referenced in advisor response", () => {
  const cited = extractCitedOpportunityIds(
    "You should prioritize the Backend Engineering Intern at Kampala FinLabs because it closes soon.",
    sampleOpportunities
  );
  assert.deepEqual(cited, ["opp-1"]);
});
