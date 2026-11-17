"use client";

import React from "react";
import { MapPin, RotateCcw } from "lucide-react";
import { UgandaRegion } from "@/types";
import { ALL_UGANDA_CITIES, UGANDA_CITIES_BY_REGION } from "@/lib/seed-data";

interface RegionCityFilterProps {
  selectedRegion: UgandaRegion;
  selectedCity: string;
  regionCounts: Record<UgandaRegion, number>;
  onSelectRegion: (region: UgandaRegion) => void;
  onSelectCity: (city: string) => void;
  onReset: () => void;
}

const REGION_OPTIONS: UgandaRegion[] = [
  "All Uganda",
  "Central",
  "Western",
  "Eastern",
  "Northern",
  "Nationwide",
];

export function RegionCityFilter({
  selectedRegion,
  selectedCity,
  regionCounts,
  onSelectRegion,
  onSelectCity,
  onReset,
}: RegionCityFilterProps) {
  const cities =
    selectedRegion === "All Uganda"
      ? ALL_UGANDA_CITIES
      : UGANDA_CITIES_BY_REGION[selectedRegion];

  const isFiltered = selectedRegion !== "All Uganda" || selectedCity !== "All";
  const activeSummary =
    selectedCity !== "All"
      ? `${selectedCity} · ${selectedRegion}`
      : selectedRegion;

  return (
    <section
      aria-label="Filter by Uganda region and city"
      className="rounded-2xl border border-outline bg-surface p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <h2 className="font-display text-sm font-semibold text-ink whitespace-nowrap">
            Uganda Region &amp; City
          </h2>
          <span className="text-xs text-ink-secondary hidden sm:inline truncate">
            · {activeSummary}
          </span>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            className="min-h-[36px] px-2.5 rounded-[10px] text-xs font-medium text-primary hover:bg-surface-low inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Scrollable Region Buttons with Live Counts */}
      <div
        role="group"
        aria-label="Uganda regions"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
      >
        {REGION_OPTIONS.map((region) => {
          const isActive = selectedRegion === region;
          const count = regionCounts[region] ?? 0;
          return (
            <button
              key={region}
              type="button"
              onClick={() => onSelectRegion(region)}
              aria-pressed={isActive}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-[10px] text-xs font-medium inline-flex items-center gap-2 border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "bg-primary text-white dark:text-[#04261D] border-primary font-semibold"
                  : "bg-surface-low text-ink-secondary border-outline hover:text-ink hover:border-primary/40"
              }`}
            >
              <span>{region}</span>
              <span
                className={`font-mono tabular-nums text-[11px] ${
                  isActive
                    ? "text-white/85 dark:text-[#04261D]/80"
                    : "text-ink-secondary"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contextual City Buttons */}
      <div
        role="group"
        aria-label="Ugandan cities"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-outline/70"
      >
        <button
          type="button"
          onClick={() => onSelectCity("All")}
          aria-pressed={selectedCity === "All"}
          className={`min-h-[36px] px-3 py-1 rounded-[10px] text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedCity === "All"
              ? "bg-secondary-container text-on-secondary-container font-semibold"
              : "text-ink-secondary hover:bg-surface-low hover:text-ink"
          }`}
        >
          All Cities
        </button>
        {cities.map((city) => {
          const isActive = selectedCity === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => onSelectCity(city)}
              aria-pressed={isActive}
              className={`min-h-[36px] px-3 py-1 rounded-[10px] text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container font-semibold"
                  : "text-ink-secondary hover:bg-surface-low hover:text-ink"
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>
    </section>
  );
}
