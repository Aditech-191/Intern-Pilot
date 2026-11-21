/**
 * Ugandan University Campus Media Registry & Showcase Utilities
 * Maps built-in campus photography and merges student-uploaded custom campus photos.
 */

export interface UniversityCampusSlide {
  id: string;
  university: string;
  shortLabel: string;
  cityRegion: string;
  caption: string;
  imageUrl: string;
  sourceType: "official" | "custom";
  objectPosition: string;
}

export const BUILTIN_UNIVERSITY_SLIDES: UniversityCampusSlide[] = [
  {
    id: "builtin-makerere",
    university: "Makerere University",
    shortLabel: "Makerere",
    cityRegion: "Makerere Hill, Kampala · Central Uganda",
    caption: "Main Administration Tower & Campus Grounds",
    imageUrl: "/assets/aistudio/images_35f4f345.jpeg",
    sourceType: "official",
    objectPosition: "center 16%",
  },
  {
    id: "builtin-kyambogo",
    university: "Kyambogo University",
    shortLabel: "Kyambogo",
    cityRegion: "Banda Hill, Kampala · Central Uganda",
    caption: "Main University Gate & Entrance Boulevard",
    imageUrl: "/assets/aistudio/kyu_46ca2234.jpeg",
    sourceType: "official",
    objectPosition: "center center",
  },
  {
    id: "builtin-victoria",
    university: "Victoria University",
    shortLabel: "Victoria University",
    cityRegion: "Kampala Road · Central Uganda",
    caption: "Victoria Towers City Campus",
    imageUrl: "/assets/aistudio/Victoria_7f473799.jpeg",
    sourceType: "official",
    objectPosition: "center 42%",
  },
];

const UNIVERSITY_REGION_HINTS: Record<string, string> = {
  "makerere university": "Makerere Hill, Kampala · Central Uganda",
  "kyambogo university": "Banda Hill, Kampala · Central Uganda",
  "victoria university": "Kampala Road · Central Uganda",
  "mbarara university of science & technology (must)": "Mbarara · Western Uganda",
  "busitema university": "Busitema / Tororo · Eastern Uganda",
  "gulu university": "Gulu · Northern Uganda",
  "uganda christian university (ucu)": "Mukono · Central Uganda",
  "makerere university business school (mubs)": "Nakawa, Kampala · Central Uganda",
  "kabale university": "Kabale · Western Uganda",
  "lira university": "Lira · Northern Uganda",
  "soroti university": "Soroti · Eastern Uganda",
  "uganda martyrs university": "Nkozi, Mpigi · Central Uganda",
  "isbat university": "Lugogo, Kampala · Central Uganda",
  "utamu university": "Bugolobi, Kampala · Central Uganda",
  "mountains of the moon university": "Fort Portal · Western Uganda",
  "nkumba university": "Entebbe Road, Wakiso · Central Uganda",
  "kampala international university (kiu)": "Kansanga, Kampala · Central Uganda",
};

export function getUniversityCityRegionHint(university: string): string {
  const key = university.trim().toLowerCase();
  return UNIVERSITY_REGION_HINTS[key] || "Uganda Campus";
}

export function isValidCampusImageUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("/assets/") ||
    /^data:image\/(?:png|jpeg|jpg|webp|gif|bmp|svg\+xml|x-icon);base64,[A-Za-z0-9+/=]+$/i.test(
      trimmed
    )
  );
}

export function hasBuiltInCampusPhoto(university: string): boolean {
  const target = university.trim().toLowerCase();
  if (!target) return false;
  return BUILTIN_UNIVERSITY_SLIDES.some(
    (s) => s.university.toLowerCase() === target
  );
}

function makeShortLabel(university: string): string {
  const parenMatch = university.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim();
  }
  const clean = university.trim();
  return clean.length > 22 ? `${clean.slice(0, 20)}...` : clean;
}

/**
 * Builds the merged list of official and user-uploaded campus slides,
 * prioritizing the active student's university first when present.
 */
export function buildUniversityCampusSlides(
  customPhotos: Record<string, string> | null | undefined,
  activeUniversity?: string | null
): UniversityCampusSlide[] {
  const customMap = new Map<string, { university: string; imageUrl: string }>();

  if (customPhotos && typeof customPhotos === "object") {
    for (const [uniName, dataUrl] of Object.entries(customPhotos)) {
      const cleanUni = uniName.trim();
      if (!cleanUni || !isValidCampusImageUrl(dataUrl)) continue;
      customMap.set(cleanUni.toLowerCase(), {
        university: cleanUni,
        imageUrl: dataUrl.trim(),
      });
    }
  }

  const merged: UniversityCampusSlide[] = BUILTIN_UNIVERSITY_SLIDES.map((slide) => {
    const customOverride = customMap.get(slide.university.toLowerCase());
    if (customOverride) {
      customMap.delete(slide.university.toLowerCase());
      return {
        ...slide,
        imageUrl: customOverride.imageUrl,
        sourceType: "custom",
        caption: "Custom Campus Upload",
      };
    }
    return slide;
  });

  // Append custom uploads for any other universities
  for (const [, entry] of Array.from(customMap.entries())) {
    const slug =
      entry.university
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "campus";

    merged.push({
      id: `custom-${slug}`,
      university: entry.university,
      shortLabel: makeShortLabel(entry.university),
      cityRegion: getUniversityCityRegionHint(entry.university),
      caption: "Custom Student Campus Upload",
      imageUrl: entry.imageUrl,
      sourceType: "custom",
      objectPosition: "center center",
    });
  }

  // Move active student's university to index 0 so their campus opens first
  const activeKey = (activeUniversity || "").trim().toLowerCase();
  if (activeKey) {
    const matchIndex = merged.findIndex(
      (s) => s.university.toLowerCase() === activeKey
    );
    if (matchIndex > 0) {
      const [matched] = merged.splice(matchIndex, 1);
      merged.unshift(matched);
    }
  }

  return merged;
}

export function findSlideIndexForUniversity(
  slides: UniversityCampusSlide[],
  university: string | null | undefined
): number {
  const key = (university || "").trim().toLowerCase();
  if (!key) return -1;
  return slides.findIndex((s) => s.university.toLowerCase() === key);
}

/**
 * Browser helper: compresses and scales landscape campus photography to max 960px wide
 * so localStorage remains snappy and well within storage budgets.
 */
export async function readAndOptimizeCampusPhotoFile(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read campus photo file."));
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image decode fallback"));
      el.src = rawDataUrl;
    });

    const maxDim = 960;
    const scale = Math.min(
      1,
      maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1)
    );
    const width = Math.max(1, Math.round((img.naturalWidth || maxDim) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || maxDim) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return rawDataUrl;
  }
}
