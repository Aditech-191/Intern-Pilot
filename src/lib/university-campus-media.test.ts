import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILTIN_UNIVERSITY_SLIDES,
  buildUniversityCampusSlides,
  findSlideIndexForUniversity,
  getUniversityCityRegionHint,
  hasBuiltInCampusPhoto,
  isValidCampusImageUrl,
} from "./university-campus-media";

test("Built-in university slides map Makerere, Kyambogo, and Victoria University to uploaded assets", () => {
  assert.equal(BUILTIN_UNIVERSITY_SLIDES.length, 3);
  const byName = new Map(
    BUILTIN_UNIVERSITY_SLIDES.map((s) => [s.university, s.imageUrl])
  );
  assert.equal(
    byName.get("Makerere University"),
    "/assets/aistudio/images_35f4f345.jpeg"
  );
  assert.equal(
    byName.get("Kyambogo University"),
    "/assets/aistudio/kyu_46ca2234.jpeg"
  );
  assert.equal(
    byName.get("Victoria University"),
    "/assets/aistudio/Victoria_7f473799.jpeg"
  );
  assert.equal(hasBuiltInCampusPhoto("Victoria University"), true);
  assert.equal(hasBuiltInCampusPhoto("UTAMU University"), false);
});

test("buildUniversityCampusSlides merges custom university photos, prioritizes active university, and blocks unsafe URIs", () => {
  const validDataUrl = "data:image/png;base64,iVBORw0KGgo=";
  const slides = buildUniversityCampusSlides(
    {
      "UTAMU University": validDataUrl,
      "Bad Uni": "javascript:alert(1)",
    },
    "UTAMU University"
  );

  // 3 official + 1 valid custom (unsafe Bad Uni ignored)
  assert.equal(slides.length, 4);
  assert.equal(slides[0].university, "UTAMU University");
  assert.equal(slides[0].sourceType, "custom");
  assert.equal(slides[0].cityRegion, "Bugolobi, Kampala · Central Uganda");
  assert.equal(findSlideIndexForUniversity(slides, "victoria university") >= 0, true);
  assert.equal(isValidCampusImageUrl("javascript:alert(1)"), false);
  assert.equal(isValidCampusImageUrl("/assets/aistudio/Victoria_7f473799.jpeg"), true);
});

test("buildUniversityCampusSlides lets custom upload override an official university cleanly", () => {
  const customVictoria = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
  const slides = buildUniversityCampusSlides(
    { "Victoria University": customVictoria },
    "Victoria University"
  );

  assert.equal(slides.length, 3);
  assert.equal(slides[0].university, "Victoria University");
  assert.equal(slides[0].sourceType, "custom");
  assert.equal(slides[0].imageUrl, customVictoria);
  assert.equal(
    getUniversityCityRegionHint("Mountains of the Moon University"),
    "Fort Portal · Western Uganda"
  );
});
