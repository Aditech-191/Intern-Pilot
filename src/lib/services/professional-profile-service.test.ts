import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProfileLookupInput,
  buildProfessionalLookupQuery,
  extractGroundingSources,
  parseProfessionalSummaryResponse,
  getNewDiscoveredSkills,
} from "./professional-profile-service";

test("validateProfileLookupInput normalizes LinkedIn handles, blocks unsafe schemes, and requires name or LinkedIn", () => {
  const empty = validateProfileLookupInput({});
  assert.equal(empty.ok, false);

  const xss = validateProfileLookupInput({ linkedinUrl: "javascript:alert(1)" });
  assert.equal(xss.ok, false);

  const byHandle = validateProfileLookupInput({
    linkedinUrl: "grace-namono",
    university: "Victoria University",
  });
  assert.equal(byHandle.ok, true);
  if (byHandle.ok) {
    assert.equal(byHandle.data.linkedinUrl, "https://www.linkedin.com/in/grace-namono");
    assert.equal(byHandle.data.university, "Victoria University");
  }

  const byName = validateProfileLookupInput({
    name: "Grace Namono",
    course: "BSc Computer Science",
  });
  assert.equal(byName.ok, true);
  if (byName.ok) {
    assert.equal(byName.data.name, "Grace Namono");
    assert.equal(byName.data.linkedinUrl, null);
  }
});

test("buildProfessionalLookupQuery includes identifiers and strict anti-fabrication instructions", () => {
  const prompt = buildProfessionalLookupQuery({
    name: "Grace Namono",
    university: "Victoria University",
    course: "Software Engineering",
    linkedinUrl: "https://www.linkedin.com/in/grace-namono",
    githubUrl: "https://github.com/grace-dev",
    existingSkills: ["TypeScript", "React"],
  });

  assert.ok(prompt.includes("https://www.linkedin.com/in/grace-namono"));
  assert.ok(prompt.includes("Victoria University"));
  assert.ok(prompt.includes("NEVER invent"));
  assert.ok(prompt.includes("not_found"));
});

test("extractGroundingSources deduplicates and filters only safe http/https web citations", () => {
  const sources = extractGroundingSources([
    { web: { uri: "https://www.linkedin.com/in/example", title: "Example | LinkedIn" } },
    { web: { uri: "https://www.linkedin.com/in/example", title: "Duplicate" } },
    { web: { uri: "javascript:alert(1)", title: "Evil" } },
    { web: { uri: "https://github.com/example", title: "" } },
  ]);

  assert.equal(sources.length, 2);
  assert.equal(sources[0].uri, "https://www.linkedin.com/in/example");
  assert.equal(sources[0].title, "Example | LinkedIn");
  assert.equal(sources[1].uri, "https://github.com/example");
  assert.equal(sources[1].title, "github.com");
});

test("parseProfessionalSummaryResponse parses fenced JSON, deduplicates skills, and falls back gracefully on prose", () => {
  const fenced = `\`\`\`json
  {
    "headline": "Software Engineering Student at Victoria University",
    "summary": "Public LinkedIn summary showing backend and cloud work.",
    "extractedSkills": ["Python", "python", "Docker", "<script>alert(1)</script>SQL"],
    "experienceHighlights": ["Intern at Kampala Cloud Labs"],
    "educationHighlights": ["BSc Software Engineering, Victoria University"],
    "alignmentNotes": "Adds Docker and SQL to strengthen backend match accuracy.",
    "confidence": "verified_web"
  }
  \`\`\``;

  const parsed = parseProfessionalSummaryResponse(
    fenced,
    [{ title: "LinkedIn", uri: "https://www.linkedin.com/in/grace-namono" }],
    {
      queriedLinkedinUrl: "https://www.linkedin.com/in/grace-namono",
      queriedName: "Grace Namono",
      fetchedAt: "2026-11-18T12:00:00.000Z",
    }
  );

  assert.equal(parsed.confidence, "verified_web");
  assert.deepEqual(parsed.extractedSkills, ["Python", "Docker", "SQL"]);
  assert.equal(parsed.experienceHighlights.length, 1);
  assert.equal(parsed.sources.length, 1);

  const fallback = parseProfessionalSummaryResponse("No public LinkedIn profile matched.", [], {
    queriedLinkedinUrl: null,
    queriedName: "Unknown Person",
  });
  assert.equal(fallback.confidence, "not_found");
  assert.ok(fallback.summary.includes("No public LinkedIn profile matched."));
});

test("getNewDiscoveredSkills returns only net-new skills case-insensitively", () => {
  const additions = getNewDiscoveredSkills(
    ["TypeScript", "React"],
    ["typescript", "Docker", "PostgreSQL", "DOCKER", "React"]
  );
  assert.deepEqual(additions, ["Docker", "PostgreSQL"]);
});
