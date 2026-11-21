"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Upload,
  Trash2,
  MapPin,
  AlertCircle,
  Check,
  Building2,
} from "lucide-react";
import { UGANDA_UNIVERSITIES } from "@/lib/seed-data";
import { validateImageUpload } from "@/lib/file-security";
import {
  buildUniversityCampusSlides,
  findSlideIndexForUniversity,
  readAndOptimizeCampusPhotoFile,
} from "@/lib/university-campus-media";

interface UniversityCampusStripProps {
  activeUniversity: string;
  customUniversityPhotos: Record<string, string>;
  onUploadUniversityPhoto: (university: string, dataUrl: string) => void;
  onRemoveUniversityPhoto: (university: string) => void;
}

const SLIDE_INTERVAL_MS = 6500;
const KEN_BURNS_CLASSES = [
  "animate-kenburns-a",
  "animate-kenburns-b",
  "animate-kenburns-c",
];

export function UniversityCampusStrip({
  activeUniversity,
  customUniversityPhotos,
  onUploadUniversityPhoto,
  onRemoveUniversityPhoto,
}: UniversityCampusStripProps) {
  const slides = useMemo(
    () => buildUniversityCampusSlides(customUniversityPhotos, activeUniversity),
    [customUniversityPhotos, activeUniversity]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});
  const [showUploaderBar, setShowUploaderBar] = useState(false);
  const [uploadTargetUni, setUploadTargetUni] = useState(
    activeUniversity.trim() || "Mbarara University of Science & Technology (MUST)"
  );
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFocusUniRef = useRef<string | null>(null);
  const prevProfileUniRef = useRef<string>(activeUniversity);

  // Synchronize active slide only when student's profile university changes or a new campus photo is uploaded
  useEffect(() => {
    if (pendingFocusUniRef.current) {
      const targetIdx = findSlideIndexForUniversity(slides, pendingFocusUniRef.current);
      if (targetIdx >= 0) {
        setActiveIndex(targetIdx);
        pendingFocusUniRef.current = null;
        prevProfileUniRef.current = activeUniversity;
        return;
      }
    }
    if (prevProfileUniRef.current !== activeUniversity) {
      prevProfileUniRef.current = activeUniversity;
      const idx = findSlideIndexForUniversity(slides, activeUniversity);
      if (idx >= 0) {
        setActiveIndex(idx);
      }
    }
  }, [activeUniversity, slides]);

  useEffect(() => {
    if (activeUniversity.trim()) {
      setUploadTargetUni(activeUniversity.trim());
    }
  }, [activeUniversity]);

  // Auto-advance crossfade slideshow unless paused or user is hovering/interacting
  useEffect(() => {
    if (!isPlaying || isHovering || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isPlaying, isHovering, slides.length]);

  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[safeIndex];
  const hasPhotoForProfileUni = Boolean(
    activeUniversity.trim() &&
      findSlideIndexForUniversity(slides, activeUniversity) >= 0
  );

  const handleSelectSlide = (index: number) => {
    setActiveIndex(index);
    setUploadError("");
    setUploadStatus("");
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const handleUploadFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploadStatus("");

    const targetName = uploadTargetUni.trim();
    if (!targetName) {
      setUploadError("Select or type a university name first.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const validation = await validateImageUpload(file);
    if (!validation.valid) {
      setUploadError(validation.error || "Please choose a valid picture file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const optimizedDataUrl = await readAndOptimizeCampusPhotoFile(file);
      pendingFocusUniRef.current = targetName;
      onUploadUniversityPhoto(targetName, optimizedDataUrl);
      setUploadStatus(`Added animated campus photo for ${targetName}.`);
      setShowUploaderBar(false);
    } catch {
      pendingFocusUniRef.current = null;
      setUploadError("Could not process this image file. Try another photo.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const uploadUniversityOptions = useMemo(() => {
    const base = UGANDA_UNIVERSITIES.filter((u) => u !== "Other University");
    if (
      activeUniversity.trim() &&
      !base.some((u) => u.toLowerCase() === activeUniversity.trim().toLowerCase())
    ) {
      return [activeUniversity.trim(), ...base];
    }
    return base;
  }, [activeUniversity]);

  return (
    <section
      aria-label="Ugandan university campuses showcase"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="rounded-2xl border border-outline bg-surface overflow-hidden"
    >
      {/* Compact Strip Header Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-outline flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-display text-sm sm:text-base font-semibold text-ink tracking-tight whitespace-nowrap">
            Ugandan University Campuses
          </h2>
          <span
            aria-hidden="true"
            className="text-ink-secondary/50 hidden sm:inline"
          >
            ·
          </span>
          <span className="font-mono tabular-nums text-xs text-ink-secondary hidden sm:inline">
            {String(safeIndex + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>
          {activeUniversity.trim() && (
            <>
              <span
                aria-hidden="true"
                className="text-ink-secondary/50 hidden md:inline"
              >
                ·
              </span>
              <span className="text-xs text-primary font-medium truncate hidden md:inline max-w-[260px]">
                Your Campus: {activeUniversity.trim()}
              </span>
            </>
          )}
        </div>

        {/* Playback & Custom Campus Upload Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous university campus"
            className="w-10 h-10 rounded-[10px] border border-outline bg-surface-low hover:border-primary/45 text-ink flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pause campus slideshow" : "Play campus slideshow"}
            aria-pressed={!isPlaying}
            className="w-10 h-10 rounded-[10px] border border-outline bg-surface-low hover:border-primary/45 text-ink flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next university campus"
            className="w-10 h-10 rounded-[10px] border border-outline bg-surface-low hover:border-primary/45 text-ink flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowUploaderBar((prev) => !prev);
              setUploadError("");
              setUploadStatus("");
            }}
            aria-expanded={showUploaderBar}
            className="min-h-[40px] px-3.5 rounded-[10px] border border-outline bg-surface-low hover:border-primary/50 text-xs font-semibold text-ink inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>
              {activeUniversity.trim() && !hasPhotoForProfileUni
                ? "Add Your Campus Photo"
                : "Upload Campus Photo"}
            </span>
          </button>
        </div>
      </div>

      {/* Inline Custom University Photo Upload Bar */}
      {showUploaderBar && (
        <div className="px-4 sm:px-5 py-3.5 border-b border-outline bg-surface-low space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label htmlFor="strip-uni-select" className="sr-only">
              Choose university for custom photo
            </label>
            <select
              id="strip-uni-select"
              value={uploadTargetUni}
              onChange={(e) => setUploadTargetUni(e.target.value)}
              className="flex-1 min-h-[42px] rounded-xl border border-outline bg-surface px-3 text-xs sm:text-sm text-ink focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {uploadUniversityOptions.map((uni) => (
                <option key={uni} value={uni}>
                  {uni}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              id="strip-campus-photo-input"
              type="file"
              accept="image/*"
              onChange={handleUploadFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[42px] px-4 rounded-[10px] bg-primary hover:opacity-90 text-white dark:text-[#04261D] text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-opacity"
            >
              <Upload className="w-3.5 h-3.5" />
              Choose Picture File
            </button>
          </div>
          <p className="text-[11px] text-ink-secondary">
            Upload a landscape photo (max 5 MB) for any Ugandan university to add it to this animated Ken Burns showcase.
          </p>
        </div>
      )}

      {/* Upload Status / Error Notices */}
      {uploadError && (
        <div
          role="alert"
          className="px-4 sm:px-5 py-2.5 border-b border-outline bg-tertiary-container/50 text-xs font-medium text-on-tertiary-container flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}
      {uploadStatus && (
        <div
          role="status"
          className="px-4 sm:px-5 py-2.5 border-b border-outline bg-primary-container/50 text-xs font-medium text-on-primary-container flex items-center gap-2"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* Main Stage + University Thumbnail Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Active Animated Ken Burns Crossfade Stage */}
        <div className="lg:col-span-7 xl:col-span-8 relative min-h-[210px] sm:min-h-[245px] lg:min-h-[260px] overflow-hidden bg-[#0B221B]">
          {slides.map((slide, idx) => {
            const isCurrent = idx === safeIndex;
            const kenBurnsClass = KEN_BURNS_CLASSES[idx % KEN_BURNS_CLASSES.length];
            const imgFailed = Boolean(failedUrls[slide.imageUrl]);

            return (
              <div
                key={slide.id}
                aria-hidden={!isCurrent}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                  isCurrent ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                {imgFailed ? (
                  <div className="w-full h-full bg-gradient-to-br from-[#0D4A3A] to-[#081914] flex flex-col items-center justify-center text-[#C8EFE0] p-6 text-center">
                    <Building2 className="w-8 h-8 mb-2 opacity-80" />
                    <p className="font-display text-base font-semibold">
                      {slide.university}
                    </p>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt={`${slide.university} campus in ${slide.cityRegion}`}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setFailedUrls((prev) => ({ ...prev, [slide.imageUrl]: true }))
                    }
                    style={{ objectPosition: slide.objectPosition }}
                    className={`w-full h-full object-cover ${
                      isCurrent ? kenBurnsClass : ""
                    } ${!isPlaying || isHovering ? "kenburns-paused" : ""}`}
                  />
                )}
              </div>
            );
          })}

          {/* WCAG AA Contrast Gradient Scrim */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-20 bg-gradient-to-t from-[#071510]/95 via-[#071510]/60 to-transparent pointer-events-none"
          />

          {/* Editorial Caption Overlay */}
          {activeSlide && (
            <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#C8EFE0]">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{activeSlide.cityRegion}</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">
                    {activeSlide.sourceType === "custom"
                      ? "Custom Upload"
                      : "Featured Campus"}
                  </span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-[#F6F3EB] tracking-tight truncate">
                  {activeSlide.university}
                </h3>

                <p className="text-xs text-[#D8E2DD] truncate">
                  {activeSlide.caption}
                </p>
              </div>

              {activeSlide.sourceType === "custom" && (
                <button
                  type="button"
                  onClick={() => {
                    onRemoveUniversityPhoto(activeSlide.university);
                    setUploadStatus(
                      `Removed custom photo for ${activeSlide.university}.`
                    );
                    setActiveIndex(0);
                  }}
                  className="min-h-[36px] px-3 rounded-[10px] bg-black/45 hover:bg-black/65 border border-white/25 text-xs font-medium text-[#F6F3EB] inline-flex items-center gap-1.5 self-start sm:self-end whitespace-nowrap shrink-0 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Custom Photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selectable Campus Thumbnail Rail */}
        <div
          role="listbox"
          aria-label="Select a university campus to view"
          className="lg:col-span-5 xl:col-span-4 border-t lg:border-t-0 lg:border-l border-outline bg-surface-low p-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[260px] no-scrollbar"
        >
          {slides.map((slide, idx) => {
            const isCurrent = idx === safeIndex;
            const isStudentsUni =
              Boolean(activeUniversity.trim()) &&
              slide.university.toLowerCase() ===
                activeUniversity.trim().toLowerCase();

            return (
              <button
                key={slide.id}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => handleSelectSlide(idx)}
                className={`min-h-[60px] min-w-[220px] sm:min-w-[240px] lg:min-w-0 w-auto lg:w-full p-2 rounded-xl border text-left flex items-center gap-3 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isCurrent
                    ? "border-primary bg-primary-container/35"
                    : "border-outline bg-surface hover:border-primary/40"
                }`}
              >
                <div className="w-16 h-11 rounded-lg overflow-hidden bg-[#0B221B] shrink-0 border border-outline/60">
                  {failedUrls[slide.imageUrl] ? (
                    <div className="w-full h-full flex items-center justify-center text-[#C8EFE0] text-xs font-bold">
                      {slide.shortLabel.slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.imageUrl}
                      alt={slide.university}
                      referrerPolicy="no-referrer"
                      style={{ objectPosition: slide.objectPosition }}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-ink truncate">
                    {slide.university}
                  </p>
                  <p className="text-[11px] text-ink-secondary truncate mt-0.5">
                    {isStudentsUni ? "Your University · " : ""}
                    {slide.cityRegion.split("·")[0].trim()}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Helpful Callout When Student's Selected University Lacks a Campus Photo */}
          {activeUniversity.trim() && !hasPhotoForProfileUni && (
            <button
              type="button"
              onClick={() => {
                setUploadTargetUni(activeUniversity.trim());
                setShowUploaderBar(true);
              }}
              className="min-h-[60px] min-w-[220px] lg:min-w-0 w-auto lg:w-full p-2.5 rounded-xl border border-dashed border-primary/50 bg-primary-container/20 hover:bg-primary-container/35 text-left flex items-center gap-3 transition-colors shrink-0"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink truncate">
                  Add {activeUniversity.trim()} photo
                </p>
                <p className="text-[11px] text-ink-secondary truncate">
                  Personalize this animated strip
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
