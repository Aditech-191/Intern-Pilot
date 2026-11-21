"use client";

import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { UniversityCampusSlide } from "@/lib/university-campus-media";

interface UniversityCampusBackdropProps {
  slides: UniversityCampusSlide[];
  intervalMs?: number;
  paused?: boolean;
  onActiveSlideChange?: (slide: UniversityCampusSlide, index: number) => void;
}

const KEN_BURNS_CLASSES = [
  "animate-kenburns-a",
  "animate-kenburns-b",
  "animate-kenburns-c",
];

/**
 * Reusable smooth crossfade + Ken Burns pan-and-zoom backdrop
 * for Ugandan university campus photography across hero and auth panels.
 */
export function UniversityCampusBackdrop({
  slides,
  intervalMs = 6500,
  paused = false,
  onActiveSlideChange,
}: UniversityCampusBackdropProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  // Reset to index 0 when the prioritized slide list changes (e.g. profile university switched)
  const leadSlideId = slides[0]?.id ?? "";
  useEffect(() => {
    setActiveIndex(0);
  }, [leadSlideId, slides.length]);

  // Auto-advance crossfade slideshow
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, intervalMs, slides.length]);

  const safeIndex = activeIndex < slides.length ? activeIndex : 0;
  const activeSlide = slides[safeIndex];

  useEffect(() => {
    if (activeSlide && onActiveSlideChange) {
      onActiveSlideChange(activeSlide, safeIndex);
    }
  }, [activeSlide, safeIndex, onActiveSlideChange]);

  if (slides.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#0D4A3A] to-[#081914]"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#0B221B]"
    >
      {slides.map((slide, idx) => {
        const isCurrent = idx === safeIndex;
        const kenBurnsClass = KEN_BURNS_CLASSES[idx % KEN_BURNS_CLASSES.length];
        const imgFailed = Boolean(failedUrls[slide.imageUrl]);

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              isCurrent ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {imgFailed ? (
              <div className="w-full h-full bg-gradient-to-br from-[#0D4A3A] to-[#081914] flex items-center justify-center text-[#C8EFE0]/40">
                <Building2 className="w-10 h-10" />
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
                } ${paused ? "kenburns-paused" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
