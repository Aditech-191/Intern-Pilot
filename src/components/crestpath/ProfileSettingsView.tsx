"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  X,
  Check,
  Sun,
  Moon,
  Monitor,
  LogOut,
  LogIn,
  Trash2,
  UserPlus,
  Upload,
  Download,
  Linkedin,
  Github,
  ExternalLink,
  Image as ImageIcon,
  FileJson,
  AlertCircle,
} from "lucide-react";
import {
  Opportunity,
  OpportunityTracking,
  StudentProfile,
} from "@/types";
import { UGANDA_UNIVERSITIES } from "@/lib/seed-data";
import { ThemeMode, useTheme } from "@/lib/theme-context";
import {
  IMAGE_EXPORT_OPTIONS,
  ImageExportFormat,
  WorkspaceBackupPayload,
  convertImageDataUrlToBlob,
  normalizeSocialUrl,
  parseWorkspaceImportJson,
  serializeWorkspaceBackup,
} from "@/lib/profile-portability";
import { validateImageUpload, validateJsonUpload } from "@/lib/file-security";

interface ProfileSettingsViewProps {
  profiles: StudentProfile[];
  activeProfile: StudentProfile;
  opportunities: Opportunity[];
  trackingMap: Record<string, OpportunityTracking>;
  sessionEmail?: string | null;
  onSaveProfile: (profile: StudentProfile) => void;
  onSwitchProfile: (profileId: string) => void;
  onCreateProfile: () => void;
  onImportWorkspace: (
    payload: WorkspaceBackupPayload,
    mode: "replace" | "merge"
  ) => void;
  onResetWorkspace: () => void;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function readAndOptimizePhotoFile(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  // Resize very large raster images to max 640px so localStorage stays fast and well within quota
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Decode fallback"));
      el.src = rawDataUrl;
    });

    const maxDim = 640;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    const width = Math.max(1, Math.round((img.naturalWidth || maxDim) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || maxDim) * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return rawDataUrl;
  }
}

export function ProfileSettingsView({
  profiles,
  activeProfile,
  opportunities,
  trackingMap,
  sessionEmail,
  onSaveProfile,
  onSwitchProfile,
  onCreateProfile,
  onImportWorkspace,
  onResetWorkspace,
}: ProfileSettingsViewProps) {
  const router = useRouter();
  const { mode, setMode } = useTheme();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<StudentProfile>(activeProfile);
  const [customUniversity, setCustomUniversity] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [socialError, setSocialError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Profile photo export state
  const [photoExportFormat, setPhotoExportFormat] =
    useState<ImageExportFormat>("png");
  const [photoStatus, setPhotoStatus] = useState("");
  const [photoError, setPhotoError] = useState("");

  // Workspace JSON portability state
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [portabilityStatus, setPortabilityStatus] = useState("");
  const [portabilityError, setPortabilityError] = useState("");

  useEffect(() => {
    setForm(activeProfile);
    if (
      activeProfile.university &&
      !UGANDA_UNIVERSITIES.includes(activeProfile.university)
    ) {
      setCustomUniversity(activeProfile.university);
    } else {
      setCustomUniversity("");
    }
  }, [activeProfile]);

  const universitySelectValue = !form.university
    ? ""
    : UGANDA_UNIVERSITIES.includes(form.university)
    ? form.university
    : "Other University";

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");
    setPhotoStatus("");

    const validation = await validateImageUpload(file);
    if (!validation.valid) {
      setPhotoError(validation.error || "Please select a valid picture file.");
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    try {
      const dataUrl = await readAndOptimizePhotoFile(file);
      const updated = { ...form, avatarDataUrl: dataUrl };
      setForm(updated);
      onSaveProfile(updated);
      setPhotoStatus("Profile photo updated.");
    } catch {
      setPhotoError("Unable to load this image file. Try another picture.");
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = () => {
    const updated = { ...form, avatarDataUrl: null };
    setForm(updated);
    onSaveProfile(updated);
    setPhotoStatus("Profile photo removed.");
    setPhotoError("");
  };

  const handleExportPhoto = async () => {
    setPhotoError("");
    setPhotoStatus("");
    if (!form.avatarDataUrl) {
      setPhotoError("Upload a profile photo first before exporting.");
      return;
    }

    try {
      const { blob, extension } = await convertImageDataUrlToBlob(
        form.avatarDataUrl,
        photoExportFormat
      );
      const safeBase =
        (form.name.trim() || "intern-pilot-profile")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "intern-pilot-profile";
      const filename = `${safeBase}-photo.${extension}`;
      triggerBlobDownload(blob, filename);
      setPhotoStatus(`Exported profile photo as ${filename}`);
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Could not export profile photo."
      );
    }
  };

  const handleExportWorkspaceJson = () => {
    setPortabilityError("");
    setPortabilityStatus("");
    const json = serializeWorkspaceBackup({
      profiles,
      activeProfileId: activeProfile.id,
      opportunities,
      trackingMap,
    });
    const dateStamp = new Date().toISOString().split("T")[0];
    const filename = `intern-pilot-workspace-${dateStamp}.json`;
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    triggerBlobDownload(blob, filename);
    setPortabilityStatus(
      `Exported ${opportunities.length} ${
        opportunities.length === 1 ? "opportunity" : "opportunities"
      } and ${Object.keys(trackingMap).length} tracking record(s) to ${filename}.`
    );
  };

  const handleImportWorkspaceFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPortabilityError("");
    setPortabilityStatus("");

    const jsonCheck = validateJsonUpload(file);
    if (!jsonCheck.valid) {
      setPortabilityError(jsonCheck.error || "Invalid JSON backup file.");
      if (jsonInputRef.current) jsonInputRef.current.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseWorkspaceImportJson(text);
      if (!parsed.ok) {
        setPortabilityError(parsed.error);
        return;
      }
      onImportWorkspace(parsed.data, importMode);
      setPortabilityStatus(
        `${importMode === "replace" ? "Restored" : "Merged"} ${
          parsed.data.opportunities.length
        } ${
          parsed.data.opportunities.length === 1
            ? "opportunity"
            : "opportunities"
        }, ${Object.keys(parsed.data.trackingMap).length} tracking record(s), and ${
          parsed.data.profiles.length
        } profile(s).`
      );
    } catch {
      setPortabilityError("Failed to read the selected JSON file.");
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = "";
    }
  };

  const handleAddSkill = () => {
    const clean = skillInput.trim();
    if (!clean) return;
    if (!form.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, clean] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleAddInterest = () => {
    const clean = interestInput.trim();
    if (!clean) return;
    if (!form.interests.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      setForm((prev) => ({ ...prev, interests: [...prev.interests, clean] }));
    }
    setInterestInput("");
  };

  const handleRemoveInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSocialError("");

    const cleanLinkedin = normalizeSocialUrl(form.linkedinUrl, "linkedin");
    if (cleanLinkedin === null) {
      setSocialError(
        "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname) or handle."
      );
      return;
    }

    const cleanGithub = normalizeSocialUrl(form.githubUrl, "github");
    if (cleanGithub === null) {
      setSocialError(
        "Please enter a valid GitHub URL (e.g. https://github.com/yourhandle) or username."
      );
      return;
    }

    const resolvedUniversity =
      universitySelectValue === "Other University"
        ? customUniversity.trim()
        : form.university.trim();

    const updatedProfile: StudentProfile = {
      ...form,
      name: form.name.trim(),
      university: resolvedUniversity,
      course: form.course.trim(),
      cgpa: form.cgpa?.trim() || "",
      linkedinUrl: cleanLinkedin,
      githubUrl: cleanGithub,
      experience_summary: form.experience_summary.trim(),
    };

    setForm(updatedProfile);
    onSaveProfile(updatedProfile);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const themeOptions: Array<{
    value: ThemeMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { value: "system", label: "System", icon: Monitor },
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const trackedCount = Object.keys(trackingMap).length;
  const displayInitial = (
    form.name.trim() ||
    sessionEmail ||
    "S"
  )
    .slice(0, 1)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Profile &amp; Settings
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Manage your student identity, photo exports, LinkedIn &amp; GitHub
            links, and portable JSON backups.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProfile}
          className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface hover:bg-surface-low text-xs font-semibold text-ink inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <UserPlus className="w-4 h-4 text-primary" />
          New Profile Track
        </button>
      </div>

      {/* User-Created Profile Switcher */}
      {profiles.length > 1 && (
        <section
          aria-label="Switch saved student profile"
          className="rounded-2xl border border-outline bg-surface p-4 space-y-2.5"
        >
          <p className="text-xs font-semibold text-ink-secondary">
            Your Saved Profiles
          </p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p, index) => {
              const isCurrent = p.id === activeProfile.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSwitchProfile(p.id)}
                  aria-pressed={isCurrent}
                  className={`min-h-[40px] px-3.5 rounded-[10px] text-xs font-medium border transition-colors whitespace-nowrap ${
                    isCurrent
                      ? "bg-primary text-white dark:text-[#04261D] border-primary font-semibold"
                      : "bg-surface-low text-ink-secondary border-outline hover:text-ink"
                  }`}
                >
                  {p.name.trim() || `Profile ${index + 1}`}
                  {p.course.trim() ? ` · ${p.course.trim()}` : ""}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Profile Identity Card: Avatar Upload, Multi-Format Photo Export, LinkedIn & GitHub */}
      <section
        aria-label="Profile photo and social links"
        className="rounded-2xl border border-outline bg-surface p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Frame */}
          <div className="w-20 h-20 rounded-2xl border border-outline bg-primary-container text-on-primary-container flex items-center justify-center overflow-hidden shrink-0">
            {form.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.avatarDataUrl}
                alt={form.name ? `${form.name} profile photo` : "Student profile photo"}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display text-2xl font-bold">
                {displayInitial}
              </span>
            )}
          </div>

          {/* Identity Summary & Live LinkedIn/GitHub Links */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <h2 className="font-display text-lg font-bold text-ink truncate">
              {form.name.trim() || "Your Student Profile"}
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary">
              {[
                form.university.trim(),
                form.course.trim(),
                form.year_of_study ? `Year ${form.year_of_study}` : "",
                form.cgpa?.trim() ? `CGPA ${form.cgpa.trim()}` : "",
              ]
                .filter(Boolean)
                .join(" · ") || "Complete your academic profile below"}
            </p>

            {/* Visible LinkedIn & GitHub Profile Links */}
            {(activeProfile.linkedinUrl || activeProfile.githubUrl) && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {activeProfile.linkedinUrl && (
                  <a
                    href={activeProfile.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline underline-offset-2"
                  >
                    <Linkedin className="w-3.5 h-3.5 shrink-0" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
                {activeProfile.githubUrl && (
                  <a
                    href={activeProfile.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-primary hover:underline underline-offset-2"
                  >
                    <Github className="w-3.5 h-3.5 shrink-0" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upload & Multi-Extension Photo Export Toolbar */}
        <div className="pt-4 border-t border-outline/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={photoInputRef}
              id="profile-photo-upload"
              type="file"
              accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif,.svg,.ico,.tiff,.tif"
              onChange={handlePhotoUpload}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-primary-container hover:text-on-primary-container text-xs font-semibold text-ink inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              {form.avatarDataUrl ? "Change Photo" : "Upload Photo"}
            </button>

            {form.avatarDataUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="min-h-[44px] px-3.5 rounded-[10px] text-xs font-medium text-urgent hover:bg-tertiary-container/50 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="photo-export-format" className="sr-only">
              Profile photo export format
            </label>
            <div className="inline-flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-ink-secondary shrink-0" />
              <select
                id="photo-export-format"
                value={photoExportFormat}
                onChange={(e) =>
                  setPhotoExportFormat(e.target.value as ImageExportFormat)
                }
                className="min-h-[44px] rounded-[10px] border border-outline bg-surface-low px-3 text-xs font-mono text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {IMAGE_EXPORT_OPTIONS.map((opt) => (
                  <option key={opt.ext} value={opt.ext}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleExportPhoto}
              disabled={!form.avatarDataUrl}
              className="min-h-[44px] px-4 rounded-[10px] bg-primary hover:opacity-90 disabled:opacity-45 text-white dark:text-[#04261D] text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export Photo
            </button>
          </div>
        </div>

        {photoStatus && (
          <p className="text-xs font-medium text-strong" role="status">
            {photoStatus}
          </p>
        )}
        {photoError && (
          <p className="text-xs font-medium text-urgent flex items-center gap-1.5" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {photoError}
          </p>
        )}
      </section>

      {/* Main Editable Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-outline bg-surface p-5 sm:p-6 space-y-5"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold text-ink-secondary"
            >
              Full Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your full name"
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-university"
              className="block text-xs font-semibold text-ink-secondary"
            >
              Ugandan University
            </label>
            <select
              id="profile-university"
              value={universitySelectValue}
              onChange={(e) => {
                const val = e.target.value;
                setForm({
                  ...form,
                  university:
                    val === "Other University" ? customUniversity : val,
                });
              }}
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select your university</option>
              {UGANDA_UNIVERSITIES.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>
          </div>

          {universitySelectValue === "Other University" && (
            <div className="md:col-span-2 space-y-1.5">
              <label
                htmlFor="profile-custom-uni"
                className="block text-xs font-semibold text-ink-secondary"
              >
                University Name
              </label>
              <input
                id="profile-custom-uni"
                type="text"
                value={customUniversity}
                onChange={(e) => {
                  setCustomUniversity(e.target.value);
                  setForm({ ...form, university: e.target.value });
                }}
                placeholder="Type your university or institute name"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="profile-course"
              className="block text-xs font-semibold text-ink-secondary"
            >
              Degree Program
            </label>
            <input
              id="profile-course"
              type="text"
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              placeholder="e.g. BSc. Computer Science, BSc. Civil Engineering"
              className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="profile-year"
                className="block text-xs font-semibold text-ink-secondary"
              >
                Year of Study
              </label>
              <select
                id="profile-year"
                value={form.year_of_study ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    year_of_study: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Select</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="profile-cgpa"
                className="block text-xs font-semibold text-ink-secondary"
              >
                CGPA (optional)
              </label>
              <input
                id="profile-cgpa"
                type="text"
                value={form.cgpa || ""}
                onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                placeholder="e.g. 4.35 / 5.0"
                className="w-full min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm font-mono text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* LinkedIn Account Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-linkedin"
              className="block text-xs font-semibold text-ink-secondary"
            >
              LinkedIn Account
            </label>
            <div className="relative">
              <Linkedin className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="profile-linkedin"
                type="text"
                value={form.linkedinUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, linkedinUrl: e.target.value })
                }
                placeholder="https://linkedin.com/in/your-name or username"
                className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-outline bg-surface-low text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* GitHub Account Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-github"
              className="block text-xs font-semibold text-ink-secondary"
            >
              GitHub Account
            </label>
            <div className="relative">
              <Github className="w-4 h-4 text-ink-secondary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="profile-github"
                type="text"
                value={form.githubUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, githubUrl: e.target.value })
                }
                placeholder="https://github.com/your-handle or username"
                className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl border border-outline bg-surface-low text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {socialError && (
          <p
            role="alert"
            className="text-xs font-medium text-urgent flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {socialError}
          </p>
        )}

        {/* Interactive Skills Input */}
        <div className="space-y-2 pt-2 border-t border-outline/70">
          <label
            htmlFor="profile-skill-input"
            className="block text-xs font-semibold text-ink-secondary"
          >
            Your Skills (used for live Skill Alignment percentages)
          </label>
          <div className="flex gap-2">
            <input
              id="profile-skill-input"
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add a skill (e.g. React, Python, AutoCAD, Financial Modeling)"
              className="flex-1 min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              aria-label="Add skill"
              className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-primary-container hover:text-on-primary-container text-sm font-medium text-ink inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {form.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-primary-container/60 text-on-primary-container text-xs font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    aria-label={`Remove skill ${skill}`}
                    className="hover:text-urgent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-secondary">
              No skills added yet. Add your technical or academic skills above.
            </p>
          )}
        </div>

        {/* Career Interests */}
        <div className="space-y-2">
          <label
            htmlFor="profile-interest-input"
            className="block text-xs font-semibold text-ink-secondary"
          >
            Career Interests
          </label>
          <div className="flex gap-2">
            <input
              id="profile-interest-input"
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInterest();
                }
              }}
              placeholder="Add an interest (e.g. FinTech, Public Health, Renewable Energy)"
              className="flex-1 min-h-[44px] rounded-xl border border-outline bg-surface-low px-3.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              aria-label="Add interest"
              className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-secondary-container hover:text-on-secondary-container text-sm font-medium text-ink inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {form.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-secondary-container/60 text-on-secondary-container text-xs font-medium"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    aria-label={`Remove interest ${interest}`}
                    className="hover:text-urgent"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Experience Summary */}
        <div className="space-y-1.5">
          <label
            htmlFor="profile-summary"
            className="block text-xs font-semibold text-ink-secondary"
          >
            Projects &amp; Experience Summary
          </label>
          <textarea
            id="profile-summary"
            rows={3}
            value={form.experience_summary}
            onChange={(e) =>
              setForm({ ...form, experience_summary: e.target.value })
            }
            placeholder="Briefly summarize coursework projects, research, or leadership roles..."
            className="w-full rounded-xl border border-outline bg-surface-low px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline">
          <span className="text-xs font-medium text-strong" role="status">
            {savedNotice ? "Profile saved to your workspace." : ""}
          </span>

          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Check className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </form>

      {/* Workspace Data Portability (Export & Import JSON) */}
      <section
        aria-label="Workspace data export and import"
        className="rounded-2xl border border-outline bg-surface p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
              <FileJson className="w-4 h-4 text-primary" />
              Career Data Portability (JSON)
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
              Export your entire workspace—opportunities, application statuses,
              notes, checklists, and student profiles—to a portable JSON file,
              or import a backup anytime.
            </p>
          </div>
          <span className="font-mono tabular-nums text-xs text-ink-secondary whitespace-nowrap">
            {opportunities.length} opps · {trackedCount} tracked ·{" "}
            {profiles.length} {profiles.length === 1 ? "profile" : "profiles"}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-outline/70">
          <button
            type="button"
            onClick={handleExportWorkspaceJson}
            className="min-h-[44px] px-4 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-opacity whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export Workspace JSON
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="radiogroup"
              aria-label="JSON import mode"
              className="inline-flex p-1 rounded-[10px] border border-outline bg-surface-low"
            >
              <button
                type="button"
                role="radio"
                aria-checked={importMode === "replace"}
                onClick={() => setImportMode("replace")}
                className={`min-h-[34px] px-3 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap ${
                  importMode === "replace"
                    ? "bg-surface text-ink font-semibold border border-outline"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Replace
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={importMode === "merge"}
                onClick={() => setImportMode("merge")}
                className={`min-h-[34px] px-3 rounded-[8px] text-xs font-medium transition-colors whitespace-nowrap ${
                  importMode === "merge"
                    ? "bg-surface text-ink font-semibold border border-outline"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Merge
              </button>
            </div>

            <input
              ref={jsonInputRef}
              id="workspace-json-import"
              type="file"
              accept=".json,application/json"
              onChange={handleImportWorkspaceFile}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-secondary-container hover:text-on-secondary-container text-xs font-semibold text-ink inline-flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              Import Workspace JSON
            </button>
          </div>
        </div>

        {portabilityStatus && (
          <p className="text-xs font-medium text-strong" role="status">
            {portabilityStatus}
          </p>
        )}
        {portabilityError && (
          <p
            className="text-xs font-medium text-urgent flex items-center gap-1.5"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {portabilityError}
          </p>
        )}
      </section>

      {/* Appearance & Account Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-2xl border border-outline bg-surface p-5 space-y-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Appearance
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              Choose between Warm Ivory Light, Deep Savannah Dark, or follow
              your device setting.
            </p>
          </div>

          <div
            role="radiogroup"
            aria-label="Theme preference"
            className="grid grid-cols-3 gap-2"
          >
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = mode === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(opt.value)}
                  className={`min-h-[44px] px-3 rounded-[10px] border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                    active
                      ? "bg-primary text-white dark:text-[#04261D] border-primary font-semibold"
                      : "bg-surface-low text-ink-secondary border-outline hover:text-ink"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-outline bg-surface p-5 space-y-3">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              Account &amp; Local Data
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              {sessionEmail
                ? `Signed in as ${sessionEmail}`
                : "Not signed in. Your entries are stored locally in this browser."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {sessionEmail ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="min-h-[44px] px-4 rounded-[10px] border border-outline bg-surface-low hover:bg-surface text-xs font-semibold text-ink inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "Signing Out..." : "Sign Out"}
              </button>
            ) : (
              <Link
                href="/login"
                className="min-h-[44px] px-4 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onResetWorkspace();
                    setConfirmReset(false);
                  }}
                  className="min-h-[40px] px-3 rounded-[10px] bg-urgent text-white text-xs font-semibold whitespace-nowrap"
                >
                  Confirm Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[40px] px-3 rounded-[10px] border border-outline text-xs font-medium text-ink-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[44px] px-3.5 rounded-[10px] text-xs font-medium text-urgent hover:bg-tertiary-container/50 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Clear Workspace
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
