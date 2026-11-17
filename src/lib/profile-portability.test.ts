import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBmpFromRgba,
  buildIcoFromPngBytes,
  buildSvgFromImageDataUrl,
  mergeWorkspaceData,
  normalizeSocialUrl,
  parseWorkspaceImportJson,
  serializeWorkspaceBackup,
} from "./profile-portability";
import { UGANDA_UNIVERSITIES } from "./seed-data";
import { Opportunity, OpportunityTracking, StudentProfile } from "../types";

test("UGANDA_UNIVERSITIES includes Victoria University, UTAMU University, and Mountains of the Moon University", () => {
  assert.ok(UGANDA_UNIVERSITIES.includes("Victoria University"));
  assert.ok(UGANDA_UNIVERSITIES.includes("UTAMU University"));
  assert.ok(UGANDA_UNIVERSITIES.includes("Mountains of the Moon University"));
});

test("normalizeSocialUrl normalizes handles, full URLs, and blocks unsafe schemes", () => {
  assert.equal(
    normalizeSocialUrl("grace-namono", "github"),
    "https://github.com/grace-namono"
  );
  assert.equal(
    normalizeSocialUrl("@grace-namono", "linkedin"),
    "https://www.linkedin.com/in/grace-namono"
  );
  assert.equal(
    normalizeSocialUrl("https://github.com/aditech", "github"),
    "https://github.com/aditech"
  );
  assert.equal(normalizeSocialUrl("javascript:alert(1)", "github"), null);
  assert.equal(normalizeSocialUrl("", "linkedin"), "");
});

test("serializeWorkspaceBackup and parseWorkspaceImportJson round-trip full career workspace", () => {
  const profile: StudentProfile = {
    id: "profile-1",
    name: "Grace Namono",
    university: "Victoria University",
    course: "BSc. Computer Science",
    year_of_study: 3,
    cgpa: "4.4",
    avatarDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    linkedinUrl: "https://www.linkedin.com/in/grace-namono",
    githubUrl: "https://github.com/grace-namono",
    skills: ["TypeScript", "Python"],
    interests: ["FinTech"],
    experience_summary: "Student engineer.",
  };

  const opp: Opportunity = {
    id: "opp-1",
    title: "Data Analyst Intern",
    organization: "Kampala Analytics",
    location: "Kampala, Uganda",
    region: "Central",
    city: "Kampala",
    stipend: "UGX 600,000 / mo",
    deadline: "2026-12-01",
    eligibility: "Year 2-3 students",
    requirements: ["Python", "SQL"],
    link: "https://example.ug/apply",
    summary: "Analyze transport datasets.",
    category: "Internship",
    is_verified: true,
    source: "manual",
    created_at: "2026-11-17",
  };

  const trackingMap: Record<string, OpportunityTracking> = {
    "opp-1": {
      status: "Applied",
      saved: true,
      notes: "Submitted CV on Monday",
      checkedRequirements: ["Python"],
    },
  };

  const json = serializeWorkspaceBackup({
    profiles: [profile],
    activeProfileId: "profile-1",
    opportunities: [opp],
    trackingMap,
  });

  const result = parseWorkspaceImportJson(json);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.opportunities.length, 1);
    assert.equal(result.data.opportunities[0].title, "Data Analyst Intern");
    assert.equal(result.data.trackingMap["opp-1"].status, "Applied");
    assert.equal(result.data.trackingMap["opp-1"].notes, "Submitted CV on Monday");
    assert.equal(result.data.profiles[0].university, "Victoria University");
    assert.equal(
      result.data.profiles[0].githubUrl,
      "https://github.com/grace-namono"
    );
    assert.equal(
      result.data.profiles[0].linkedinUrl,
      "https://www.linkedin.com/in/grace-namono"
    );
    assert.equal(
      result.data.profiles[0].avatarDataUrl,
      "data:image/png;base64,iVBORw0KGgo="
    );
  }
});

test("parseWorkspaceImportJson rejects malformed or unrecognized JSON safely", () => {
  assert.equal(parseWorkspaceImportJson("not json").ok, false);
  assert.equal(parseWorkspaceImportJson('{"hello": "world"}').ok, false);
  assert.equal(parseWorkspaceImportJson("").ok, false);
});

test("mergeWorkspaceData deduplicates opportunities by ID", () => {
  const existingOpp: Opportunity = {
    id: "opp-1",
    title: "Existing",
    organization: "Org A",
    location: "Kampala",
    region: "Central",
    city: "Kampala",
    deadline: null,
    eligibility: "All",
    requirements: [],
    link: null,
    summary: "",
    category: "Internship",
    is_verified: false,
    created_at: "2026-11-17",
  };

  const merged = mergeWorkspaceData(
    {
      profiles: [],
      activeProfileId: "p1",
      opportunities: [existingOpp],
      trackingMap: {},
    },
    {
      app: "Intern Pilot",
      schemaVersion: 1,
      exportedAt: "2026-11-17T00:00:00Z",
      activeProfileId: "p1",
      profiles: [],
      opportunities: [
        existingOpp,
        { ...existingOpp, id: "opp-2", title: "New Imported" },
      ],
      trackingMap: {
        "opp-2": { status: "Saved", saved: true, notes: "", checkedRequirements: [] },
      },
    }
  );

  assert.equal(merged.opportunities.length, 2);
  assert.equal(merged.trackingMap["opp-2"].saved, true);
});

test("image binary builders generate valid SVG, ICO, and BMP payloads", () => {
  const svg = buildSvgFromImageDataUrl("data:image/png;base64,AAA", 200, 200);
  assert.ok(svg.includes("<svg"));
  assert.ok(svg.includes("data:image/png;base64,AAA"));

  const ico = buildIcoFromPngBytes(new Uint8Array([137, 80, 78, 71]), 64);
  assert.equal(ico[0], 0);
  assert.equal(ico[2], 1); // ICO type
  assert.equal(ico[4], 1); // 1 image
  assert.equal(ico[6], 64); // width

  const bmp = buildBmpFromRgba(new Uint8ClampedArray(4 * 4), 2, 2);
  assert.equal(bmp[0], 0x42); // 'B'
  assert.equal(bmp[1], 0x4d); // 'M'
});
