import {
  ApplicationStatus,
  Opportunity,
  OpportunityCategory,
  OpportunityRegion,
  OpportunityTracking,
  StudentProfile,
} from "@/types";
import { createBlankProfile } from "./seed-data";
import { inferRegionFromLocation } from "./opportunity-utils";

export interface WorkspaceBackupPayload {
  app: "Intern Pilot";
  schemaVersion: 1;
  exportedAt: string;
  activeProfileId: string;
  profiles: StudentProfile[];
  opportunities: Opportunity[];
  trackingMap: Record<string, OpportunityTracking>;
}

export interface WorkspaceImportResult {
  ok: true;
  data: WorkspaceBackupPayload;
}

export interface WorkspaceImportError {
  ok: false;
  error: string;
}

export type ImageExportFormat =
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "bmp"
  | "gif"
  | "svg"
  | "avif"
  | "ico"
  | "tiff";

export interface ImageExportOption {
  ext: ImageExportFormat;
  label: string;
  mime: string;
}

export const IMAGE_EXPORT_OPTIONS: ImageExportOption[] = [
  { ext: "png", label: "PNG (.png)", mime: "image/png" },
  { ext: "jpg", label: "JPG (.jpg)", mime: "image/jpeg" },
  { ext: "jpeg", label: "JPEG (.jpeg)", mime: "image/jpeg" },
  { ext: "webp", label: "WebP (.webp)", mime: "image/webp" },
  { ext: "avif", label: "AVIF (.avif)", mime: "image/avif" },
  { ext: "bmp", label: "BMP (.bmp)", mime: "image/bmp" },
  { ext: "gif", label: "GIF (.gif)", mime: "image/gif" },
  { ext: "svg", label: "SVG (.svg)", mime: "image/svg+xml" },
  { ext: "ico", label: "ICO (.ico)", mime: "image/x-icon" },
  { ext: "tiff", label: "TIFF (.tiff)", mime: "image/tiff" },
];

const VALID_CATEGORIES: OpportunityCategory[] = [
  "Internship",
  "Scholarship",
  "Fellowship",
  "Graduate Trainee",
];

const VALID_REGIONS: OpportunityRegion[] = [
  "Central",
  "Western",
  "Eastern",
  "Northern",
  "Nationwide",
];

const VALID_STATUSES: ApplicationStatus[] = [
  "Not Started",
  "Saved",
  "Preparing",
  "Applied",
  "Interview",
  "Accepted",
];

/**
 * Normalizes and validates a LinkedIn or GitHub profile URL or handle.
 * Returns "" when input is empty, or null if unsafe/invalid.
 */
export function normalizeSocialUrl(
  raw: string | undefined | null,
  platform: "linkedin" | "github"
): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }

  let candidate = trimmed;

  if (!/^https?:\/\//i.test(candidate)) {
    if (platform === "linkedin") {
      if (/^(www\.)?linkedin\.com\//i.test(candidate)) {
        candidate = `https://${candidate}`;
      } else {
        const handle = candidate.replace(/^@/, "").replace(/^\/+/, "");
        candidate = handle.startsWith("in/")
          ? `https://www.linkedin.com/${handle}`
          : `https://www.linkedin.com/in/${handle}`;
      }
    } else {
      if (/^(www\.)?github\.com\//i.test(candidate)) {
        candidate = `https://${candidate}`;
      } else {
        const handle = candidate.replace(/^@/, "").replace(/^\/+/, "");
        candidate = `https://github.com/${handle}`;
      }
    }
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeExternalHttpUrl(
  raw: string | undefined | null
): string | null {
  const trimmed = (raw || "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeWorkspaceBackup(params: {
  profiles: StudentProfile[];
  activeProfileId: string;
  opportunities: Opportunity[];
  trackingMap: Record<string, OpportunityTracking>;
}): string {
  const payload: WorkspaceBackupPayload = {
    app: "Intern Pilot",
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    activeProfileId: params.activeProfileId,
    profiles: params.profiles,
    opportunities: params.opportunities,
    trackingMap: params.trackingMap,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseWorkspaceImportJson(
  rawJson: string
): WorkspaceImportResult | WorkspaceImportError {
  if (!rawJson || !rawJson.trim()) {
    return { ok: false, error: "The selected file is empty." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      error: "Invalid JSON file. Please choose a valid Intern Pilot backup.",
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "Backup file must contain a JSON object with workspace data.",
    };
  }

  const obj = parsed as Record<string, unknown>;
  const hasAnySection =
    Array.isArray(obj.opportunities) ||
    Array.isArray(obj.profiles) ||
    (obj.trackingMap && typeof obj.trackingMap === "object");

  if (!hasAnySection) {
    return {
      ok: false,
      error:
        "Unrecognized JSON format. Expected opportunities, trackingMap, or profiles fields.",
    };
  }

  const rawOpps = Array.isArray(obj.opportunities) ? obj.opportunities : [];
  const opportunities: Opportunity[] = rawOpps
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .slice(0, 500)
    .map((item, idx) => {
      const title =
        typeof item.title === "string" && item.title.trim()
          ? item.title.trim().slice(0, 200)
          : `Imported Opportunity ${idx + 1}`;
      const organization =
        typeof item.organization === "string" && item.organization.trim()
          ? item.organization.trim().slice(0, 160)
          : "Unspecified Organization";
      const city = typeof item.city === "string" ? item.city.trim().slice(0, 80) : "";
      const location =
        typeof item.location === "string" && item.location.trim()
          ? item.location.trim().slice(0, 160)
          : city || "Uganda";
      const region = VALID_REGIONS.includes(item.region as OpportunityRegion)
        ? (item.region as OpportunityRegion)
        : inferRegionFromLocation(location, city);
      const category = VALID_CATEGORIES.includes(
        item.category as OpportunityCategory
      )
        ? (item.category as OpportunityCategory)
        : "Internship";

      return {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id.trim().slice(0, 100)
            : `opp-import-${Date.now()}-${idx}`,
        title,
        organization,
        location,
        region,
        city: city || (region === "Nationwide" ? "Remote / Online" : "Kampala"),
        stipend:
          typeof item.stipend === "string" && item.stipend.trim()
            ? item.stipend.trim().slice(0, 120)
            : null,
        deadline:
          typeof item.deadline === "string" &&
          /^\d{4}-\d{2}-\d{2}/.test(item.deadline.trim())
            ? item.deadline.trim().slice(0, 10)
            : null,
        eligibility:
          typeof item.eligibility === "string" && item.eligibility.trim()
            ? item.eligibility.trim().slice(0, 500)
            : "Not listed",
        requirements: Array.isArray(item.requirements)
          ? item.requirements
              .map((r) => String(r).trim())
              .filter(Boolean)
              .slice(0, 40)
          : [],
        link: sanitizeExternalHttpUrl(
          typeof item.link === "string" ? item.link : null
        ),
        summary:
          typeof item.summary === "string"
            ? item.summary.trim().slice(0, 1200)
            : "",
        category,
        is_verified: Boolean(item.is_verified),
        source: item.source === "parsed" ? "parsed" : "manual",
        warnings: Array.isArray(item.warnings)
          ? item.warnings.map((w) => String(w).trim()).filter(Boolean)
          : [],
        created_at:
          typeof item.created_at === "string" && item.created_at.trim()
            ? item.created_at.trim().slice(0, 30)
            : new Date().toISOString().split("T")[0],
      };
    });

  const rawTracking =
    obj.trackingMap &&
    typeof obj.trackingMap === "object" &&
    !Array.isArray(obj.trackingMap)
      ? (obj.trackingMap as Record<string, unknown>)
      : {};

  const trackingMap: Record<string, OpportunityTracking> = {};
  for (const [oppId, value] of Object.entries(rawTracking)) {
    if (!value || typeof value !== "object") continue;
    const t = value as Record<string, unknown>;
    const status: ApplicationStatus = VALID_STATUSES.includes(
      t.status as ApplicationStatus
    )
      ? (t.status as ApplicationStatus)
      : "Not Started";
    trackingMap[oppId] = {
      status,
      saved: Boolean(t.saved),
      notes: typeof t.notes === "string" ? t.notes.slice(0, 3000) : "",
      checkedRequirements: Array.isArray(t.checkedRequirements)
        ? t.checkedRequirements.map((r) => String(r).trim()).filter(Boolean)
        : [],
    };
  }

  const rawProfiles = Array.isArray(obj.profiles) ? obj.profiles : [];
  const profiles: StudentProfile[] = rawProfiles
    .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === "object"))
    .slice(0, 20)
    .map((p, idx) => {
      const avatar =
        typeof p.avatarDataUrl === "string" &&
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(p.avatarDataUrl)
          ? p.avatarDataUrl
          : null;
      const linkedin = normalizeSocialUrl(
        typeof p.linkedinUrl === "string" ? p.linkedinUrl : "",
        "linkedin"
      );
      const github = normalizeSocialUrl(
        typeof p.githubUrl === "string" ? p.githubUrl : "",
        "github"
      );
      return {
        id:
          typeof p.id === "string" && p.id.trim()
            ? p.id.trim().slice(0, 100)
            : `profile-import-${idx + 1}`,
        name: typeof p.name === "string" ? p.name.trim().slice(0, 120) : "",
        email: typeof p.email === "string" ? p.email.trim().slice(0, 160) : "",
        university:
          typeof p.university === "string"
            ? p.university.trim().slice(0, 160)
            : "",
        course:
          typeof p.course === "string" ? p.course.trim().slice(0, 160) : "",
        year_of_study:
          typeof p.year_of_study === "number" &&
          p.year_of_study >= 1 &&
          p.year_of_study <= 7
            ? p.year_of_study
            : null,
        cgpa: typeof p.cgpa === "string" ? p.cgpa.trim().slice(0, 30) : "",
        avatarDataUrl: avatar,
        linkedinUrl: linkedin || "",
        githubUrl: github || "",
        skills: Array.isArray(p.skills)
          ? p.skills.map((s) => String(s).trim()).filter(Boolean).slice(0, 60)
          : [],
        interests: Array.isArray(p.interests)
          ? p.interests
              .map((i) => String(i).trim())
              .filter(Boolean)
              .slice(0, 40)
          : [],
        experience_summary:
          typeof p.experience_summary === "string"
            ? p.experience_summary.trim().slice(0, 2000)
            : "",
      };
    });

  const finalProfiles =
    profiles.length > 0 ? profiles : [createBlankProfile("profile-primary")];
  const requestedActive =
    typeof obj.activeProfileId === "string" ? obj.activeProfileId : "";
  const activeProfileId = finalProfiles.some((p) => p.id === requestedActive)
    ? requestedActive
    : finalProfiles[0].id;

  return {
    ok: true,
    data: {
      app: "Intern Pilot",
      schemaVersion: 1,
      exportedAt:
        typeof obj.exportedAt === "string"
          ? obj.exportedAt
          : new Date().toISOString(),
      activeProfileId,
      profiles: finalProfiles,
      opportunities,
      trackingMap,
    },
  };
}

export function mergeWorkspaceData(
  current: {
    profiles: StudentProfile[];
    activeProfileId: string;
    opportunities: Opportunity[];
    trackingMap: Record<string, OpportunityTracking>;
  },
  incoming: WorkspaceBackupPayload
) {
  const existingOppIds = new Set(current.opportunities.map((o) => o.id));
  const mergedOpps = [
    ...incoming.opportunities.filter((o) => !existingOppIds.has(o.id)),
    ...current.opportunities,
  ];

  const mergedTracking: Record<string, OpportunityTracking> = {
    ...incoming.trackingMap,
    ...current.trackingMap,
  };

  const existingProfileIds = new Set(current.profiles.map((p) => p.id));
  const mergedProfiles = [
    ...current.profiles,
    ...incoming.profiles.filter(
      (p) =>
        !existingProfileIds.has(p.id) &&
        (p.name || p.university || p.skills.length > 0 || p.avatarDataUrl)
    ),
  ];

  return {
    profiles: mergedProfiles,
    activeProfileId: current.activeProfileId,
    opportunities: mergedOpps,
    trackingMap: mergedTracking,
  };
}

/**
 * Wraps a base64 image data URL in a valid, standalone SVG document.
 */
export function buildSvgFromImageDataUrl(
  dataUrl: string,
  width = 512,
  height = 512
): string {
  const safeHref = dataUrl.replace(/"/g, "&quot;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <image href="${safeHref}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
</svg>`;
}

/**
 * Encodes a standard Windows ICO container wrapping PNG image bytes.
 */
export function buildIcoFromPngBytes(
  pngBytes: Uint8Array,
  size = 64
): Uint8Array {
  const headerSize = 6 + 16;
  const output = new Uint8Array(headerSize + pngBytes.length);
  const view = new DataView(output.buffer);

  // ICONDIR
  view.setUint16(0, 0, true); // Reserved
  view.setUint16(2, 1, true); // Type: 1 = ICO
  view.setUint16(4, 1, true); // Count: 1 image

  // ICONDIRENTRY
  output[6] = size >= 256 ? 0 : size; // Width
  output[7] = size >= 256 ? 0 : size; // Height
  output[8] = 0; // Color palette
  output[9] = 0; // Reserved
  view.setUint16(10, 1, true); // Color planes
  view.setUint16(12, 32, true); // Bits per pixel
  view.setUint32(14, pngBytes.length, true); // Image byte size
  view.setUint32(18, headerSize, true); // Offset

  output.set(pngBytes, headerSize);
  return output;
}

/**
 * Encodes uncompressed 24-bit BMP bytes from RGBA pixel data.
 */
export function buildBmpFromRgba(
  rgba: Uint8ClampedArray,
  width: number,
  height: number
): Uint8Array {
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowStride * height;
  const fileSize = 54 + pixelArraySize;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // BITMAPFILEHEADER
  bytes[0] = 0x42; // 'B'
  bytes[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // bottom-up
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelArraySize, true);

  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      bytes[offset + x * 3] = rgba[idx + 2]; // B
      bytes[offset + x * 3 + 1] = rgba[idx + 1]; // G
      bytes[offset + x * 3 + 2] = rgba[idx]; // R
    }
    offset += rowStride;
  }

  return bytes;
}

/**
 * Converts a stored image data URL into a downloadable Blob in the requested picture extension.
 */
export async function convertImageDataUrlToBlob(
  dataUrl: string,
  format: ImageExportFormat
): Promise<{ blob: Blob; extension: ImageExportFormat }> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not decode profile photo."));
    el.src = dataUrl;
  });

  const width = img.naturalWidth || 512;
  const height = img.naturalHeight || 512;

  if (format === "svg") {
    const svg = buildSvgFromImageDataUrl(dataUrl, width, height);
    return {
      blob: new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
      extension: "svg",
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = format === "ico" ? 128 : width;
  canvas.height = format === "ico" ? 128 : height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable for photo export.");
  }

  if (format === "jpg" || format === "jpeg" || format === "bmp") {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  if (format === "bmp") {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bmpBytes = buildBmpFromRgba(imageData.data, canvas.width, canvas.height);
    const bmpBuffer = bmpBytes.buffer.slice(
      bmpBytes.byteOffset,
      bmpBytes.byteOffset + bmpBytes.byteLength
    ) as ArrayBuffer;
    return {
      blob: new Blob([bmpBuffer], { type: "image/bmp" }),
      extension: "bmp",
    };
  }

  if (format === "ico") {
    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("ICO encoding failed."))),
        "image/png"
      )
    );
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
    const icoBytes = buildIcoFromPngBytes(pngBytes, 128);
    const icoBuffer = icoBytes.buffer.slice(
      icoBytes.byteOffset,
      icoBytes.byteOffset + icoBytes.byteLength
    ) as ArrayBuffer;
    return {
      blob: new Blob([icoBuffer], { type: "image/x-icon" }),
      extension: "ico",
    };
  }

  const mimeMap: Record<
    Exclude<ImageExportFormat, "svg" | "bmp" | "ico">,
    string
  > = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
    gif: "image/gif",
    tiff: "image/tiff",
  };

  const targetMime = mimeMap[format];
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          canvas.toBlob(
            (fallback) =>
              fallback
                ? resolve(fallback)
                : reject(new Error("Image export failed.")),
            "image/png"
          );
        }
      },
      targetMime,
      0.92
    );
  });

  return { blob, extension: format };
}
