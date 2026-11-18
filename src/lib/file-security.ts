/**
 * File Upload Security & Magic Byte Validation
 * Restricts user uploads (CVs/Resumes, Profile Photos, JSON backups) to verified types and safe sizes.
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_PDF_MIME_TYPES = new Set(["application/pdf"]);
const ALLOWED_PDF_EXTENSIONS = new Set(["pdf"]);
const MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "avif",
  "svg",
  "ico",
  "tif",
  "tiff",
]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_JSON_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Checks leading magic bytes against known safe raster image headers.
 */
export function hasValidImageSignature(bytes: Uint8Array, ext: string): boolean {
  if (bytes.length < 4) return false;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }
  // GIF: GIF87a / GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return true;
  }
  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return true;
  }
  // BMP: BM
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return true;
  }
  // ICO: 00 00 01 00
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x01 &&
    bytes[3] === 0x00
  ) {
    return true;
  }
  // TIFF: II*\0 or MM\0*
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
  ) {
    return true;
  }
  // AVIF / ISO BMFF: ....ftyp
  if (
    ext === "avif" &&
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return true;
  }
  return false;
}

/**
 * Inspects SVG markup to reject embedded scripts, event handlers, javascript: URIs, or foreignObject.
 */
export function isSafeSvgMarkup(svgText: string): boolean {
  const lower = svgText.toLowerCase();
  if (!lower.includes("<svg")) return false;
  if (/<script\b|<foreignobject\b|<iframe\b|<object\b|<embed\b/i.test(svgText)) {
    return false;
  }
  if (/\bon[a-z]+\s*=|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html/i.test(svgText)) {
    return false;
  }
  return true;
}

/**
 * Validates PDF resume uploads using size, extension, MIME, and %PDF- magic bytes.
 */
export async function validateFileUpload(file: File): Promise<FileValidationResult> {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return { valid: false, error: "File exceeds 5MB size limit." };
  }

  if (file.size === 0) {
    return { valid: false, error: "Empty file cannot be processed." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_PDF_EXTENSIONS.has(ext)) {
    return { valid: false, error: "Only verified .pdf files are permitted." };
  }

  if (!ALLOWED_PDF_MIME_TYPES.has(file.type)) {
    return { valid: false, error: "Invalid content type: only PDF documents accepted." };
  }

  try {
    const arrayBuffer = await file.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const matchesPdf = PDF_MAGIC_BYTES.every((byte, idx) => bytes[idx] === byte);
    if (!matchesPdf) {
      return { valid: false, error: "File content does not match genuine PDF binary header." };
    }
  } catch {
    return { valid: false, error: "Unable to verify file binary integrity." };
  }

  return { valid: true };
}

/**
 * Validates profile image uploads using size ceiling (5MB), extension allowlist,
 * binary magic bytes (rejecting renamed executables like .exe/.sh), and SVG XSS checks.
 */
export async function validateImageUpload(file: File): Promise<FileValidationResult> {
  if (!file) return { valid: false, error: "No image file provided." };
  if (file.size === 0) return { valid: false, error: "Empty image file cannot be uploaded." };
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { valid: false, error: "Image must be smaller than 5 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: "Unsupported file type. Upload a valid picture (.png, .jpg, .webp, .gif, .bmp, .avif, .svg, .ico, .tiff).",
    };
  }

  if (file.type && !file.type.startsWith("image/")) {
    return { valid: false, error: "Invalid MIME type: only image files are permitted." };
  }

  if (ext === "svg" || file.type === "image/svg+xml") {
    try {
      const svgText = await file.text();
      if (!isSafeSvgMarkup(svgText)) {
        return {
          valid: false,
          error: "Blocked unsafe SVG file containing scripts or executable handlers.",
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "Unable to inspect SVG image safety." };
    }
  }

  try {
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!hasValidImageSignature(bytes, ext)) {
      return {
        valid: false,
        error: "File binary header does not match a valid image format.",
      };
    }
  } catch {
    return { valid: false, error: "Unable to verify image binary header." };
  }

  return { valid: true };
}

/**
 * Validates workspace JSON backup uploads (extension + 5MB ceiling).
 */
export function validateJsonUpload(file: File): FileValidationResult {
  if (!file) return { valid: false, error: "No JSON file provided." };
  if (file.size === 0) return { valid: false, error: "JSON backup file is empty." };
  if (file.size > MAX_JSON_SIZE_BYTES) {
    return { valid: false, error: "Workspace backup JSON exceeds the 5 MB limit." };
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "json") {
    return { valid: false, error: "Only .json workspace backup files are accepted." };
  }
  return { valid: true };
}
