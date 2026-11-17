"use client";

import React from "react";
import Image from "next/image";
import { FilePlus2, UserPen, ArrowLeftRight } from "lucide-react";
import heroCampusImg from "@/assets/images/hero_kampala_campus_1794946019642.jpg";
import { StudentProfile } from "@/types";

interface DiscoverHeroProps {
  profile: StudentProfile;
  profileCount: number;
  onOpenParse: () => void;
  onOpenProfile: () => void;
}

export function DiscoverHero({
  profile,
  profileCount,
  onOpenParse,
  onOpenProfile,
}: DiscoverHeroProps) {
  const hasName = Boolean(profile.name.trim());
  const academicSummary = [
    profile.university.trim(),
    profile.course.trim(),
    profile.year_of_study ? `Year ${profile.year_of_study}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const skillSummary =
    profile.skills.length > 0
      ? `${profile.skills.slice(0, 4).join(", ")}${
          profile.skills.length > 4
            ? ` +${profile.skills.length - 4} more`
            : ""
        }`
      : "No skills added yet — add your skills in Profile to score opportunity fit";

  return (
    <section
      aria-label="Student overview"
      className="relative overflow-hidden rounded-[24px] border border-outline bg-[#0B221B] min-h-[210px] sm:min-h-[232px] flex items-end"
    >
      {/* Campus Hill Editorial Artwork with Fallback */}
      <Image
        src={heroCampusImg}
        alt="Sunlit Kampala university hilltop campus surrounded by emerald trees"
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1200px"
        referrerPolicy="no-referrer"
        className="object-cover object-center"
      />

      {/* Measured Scrim for WCAG AA Contrast across all luminance regions */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#081914]/95 via-[#081914]/72 to-[#081914]/35"
      />

      <div className="relative z-10 w-full p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-medium text-[#C8EFE0] tracking-wide">
            {academicSummary || "CrestPath · Personal Uganda Career Workspace"}
          </p>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F6F3EB] tracking-tight [text-wrap:balance]">
            {hasName
              ? `Welcome back, ${profile.name.trim()}`
              : "Your Ugandan internship & scholarship hub"}
          </h1>

          <p className="text-sm text-[#D8E2DD] leading-relaxed">
            {skillSummary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenProfile}
            className="min-h-[44px] px-4 py-2 rounded-[10px] bg-white/15 hover:bg-white/25 text-[#F6F3EB] border border-white/25 backdrop-blur-sm text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63DCAD]"
          >
            {profileCount > 1 ? (
              <>
                <ArrowLeftRight className="w-4 h-4" />
                Switch Profile
              </>
            ) : (
              <>
                <UserPen className="w-4 h-4" />
                {hasName ? "Edit Profile" : "Set Up Profile"}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenParse}
            className="min-h-[44px] px-5 py-2 rounded-[10px] bg-[#63DCAD] hover:bg-[#7CE5BC] text-[#04261D] text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <FilePlus2 className="w-4 h-4" />
            Paste Forward
          </button>
        </div>
      </div>
    </section>
  );
}
