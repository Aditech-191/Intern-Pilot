/**
 * File Upload Security & Magic Byte Validation
 * Restricts user uploads (CVs/Resumes) to verified PDFs, blocking malicious executables.
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
]);

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic bytes for PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d];

/**
 * Validates file buffer, MIME type, and extension to prevent file inclusion / malware upload attacks.
 */
export async function validateFileUpload(file: File): Promise<FileValidationResult> {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  // 1. File size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds 5MB size limit." };
  }

  if (file.size === 0) {
    return { valid: false, error: "Empty file cannot be processed." };
  }

  // 2. Extension validation
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return { valid: false, error: "Only verified .pdf files are permitted." };
  }

  // 3. Declared MIME check
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: "Invalid content type: only PDF documents accepted." };
  }

  // 4. Magic byte inspection (inspecting first 5 bytes)
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

