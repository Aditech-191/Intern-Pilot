"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Clock,
  Bookmark,
  CheckCircle2,
  Plus,
  Sparkles,
  LayoutDashboard,
  Bot,
  User,
  GraduationCap,
  Building,
} from "lucide-react";
import { SEED_PROFILES, SEED_OPPORTUNITIES } from "@/lib/seed-data";
import { StudentProfile, Opportunity } from "@/types";
import { Sidebar, TabType } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { ReadinessGauge } from "@/components/dashboard/ReadinessGauge";
import { ActivityMatchCard } from "@/components/dashboard/ActivityMatchCard";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [profiles] = useState<StudentProfile[]>(SEED_PROFILES);
  const [activeProfile, setActiveProfile] = useState<StudentProfile>(SEED_PROFILES[0]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(SEED_OPPORTUNITIES);
  const [savedIds, setSavedIds] = useState<string[]>(["opp-safeboda-01"]);
  const [appliedIds, setAppliedIds] = useState<string[]>(["opp-refactory-08"]);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate matching opportunities
  const matchedOpportunities = useMemo(() => {
    const studentSkills = activeProfile.skills.map((s) => s.toLowerCase());
    return opportunities.filter((opp) =>
      opp.requirements.some((req) =>
        studentSkills.some((s) => req.toLowerCase().includes(s) || s.includes(req.toLowerCase()))
      )
    );
  }, [opportunities, activeProfile]);

  // Urgent closing count (<7 days)
  const urgentCount = useMemo(() => {
    return opportunities.filter((opp) => {
      if (!opp.deadline) return false;
      const days = Math.ceil((new Date(opp.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
      return days >= 0 && days <= 7;
    }).length;
  }, [opportunities]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Utility Bar */}
        <TopBar
          activeProfile={activeProfile}
          profiles={profiles}
          onSwitchProfile={(p) => setActiveProfile(p)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAdvisor={() => setActiveTab("advisor")}
          onOpenIngest={() => setActiveTab("ingest")}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Greeting Header */}
              <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-500/20 bg-gradient-to-r from-surface to-emerald-950/20">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {activeProfile.university}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5" />
                      {activeProfile.course} • Year {activeProfile.year_of_study}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    Good afternoon, {activeProfile.name.split(" ")[0]}!
                    <span className="inline-block animate-wave">👋</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl">
                    Here are verified tech internships and scholarships matching your software skills in Uganda today.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab("ingest")}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    Paste Opportunity
                  </button>
                  <button
                    onClick={() => setActiveTab("advisor")}
                    className="glass-button px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ask AI Advisor
                  </button>
                </div>
              </div>

              {/* Top Bento Row: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                <ActivityMatchCard
                  opportunities={opportunities}
                  student={activeProfile}
                  onExploreMatches={() => setActiveTab("opportunities")}
                />
                <ReadinessGauge
                  score={84}
                  appliedCount={appliedIds.length}
                  monthlyGoal={5}
                  openCount={opportunities.length}
                  savedCount={savedIds.length}
                />
              </div>

              {/* Bottom Metric Strip: 4-Column Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  label="Active Matches"
                  value={matchedOpportunities.length}
                  subtext="Matches your stack"
                  icon={Briefcase}
                  badge="Top Fit"
                  variant="emerald"
                  onClick={() => setActiveTab("opportunities")}
                />
                <StatCard
                  label="Closing Soon"
                  value={urgentCount}
                  subtext="Due within 7 days"
                  icon={Clock}
                  badge="Urgent"
                  variant="amber"
                  onClick={() => setActiveTab("opportunities")}
                />
                <StatCard
                  label="Saved Listings"
                  value={savedIds.length}
                  subtext="Bookmarked for later"
                  icon={Bookmark}
                  variant="sky"
                  onClick={() => setActiveTab("opportunities")}
                />
                <StatCard
                  label="Applications Sent"
                  value={appliedIds.length}
                  subtext="Active pipeline"
                  icon={CheckCircle2}
                  variant="purple"
                  onClick={() => setActiveTab("opportunities")}
                />
              </div>

              {/* Skills and Background Strip */}
              <div className="glass-card rounded-2xl p-4 sm:p-5 border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Active Profile Skills Indexed by Gemini
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {activeProfile.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="text-xs text-gray-400 hover:text-emerald-400 font-medium transition-colors shrink-0 self-start sm:self-auto"
                  >
                    Edit Profile Details &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder containers for Phases 2, 3, 4 */}
          {activeTab === "opportunities" && (
            <div className="glass-card rounded-2xl p-8 text-center border">
              <Briefcase className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">Opportunities Feed (Phase 2)</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Ready for Phase 2: Filterable feed with countdown badges, skill-matching tags, and Save/Applied toggles.
              </p>
              <button
                onClick={() => setActiveTab("overview")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium glass-button"
              >
                Back to Overview
              </button>
            </div>
          )}

          {activeTab === "advisor" && (
            <div className="glass-card rounded-2xl p-8 text-center border">
              <Bot className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">Grounded AI Advisor (Phase 4)</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Ready for Phase 4: Grounded chat advisor powered by Gemini 2.5 Flash strictly using database listings.
              </p>
              <button
                onClick={() => setActiveTab("overview")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium glass-button"
              >
                Back to Overview
              </button>
            </div>
          )}

          {activeTab === "ingest" && (
            <div className="glass-card rounded-2xl p-8 text-center border">
              <Plus className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">Messy Post Extractor (Phase 3)</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Ready for Phase 3: Paste raw WhatsApp or LinkedIn posts and extract structured JSON with Gemini.
              </p>
              <button
                onClick={() => setActiveTab("overview")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium glass-button"
              >
                Back to Overview
              </button>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="glass-card rounded-2xl p-8 text-center border">
              <User className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">Student Profile Editor</h2>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Loaded: {activeProfile.name} • {activeProfile.course} ({activeProfile.university})
              </p>
              <button
                onClick={() => setActiveTab("overview")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium glass-button"
              >
                Back to Overview
              </button>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Low-bandwidth, one-handed navigation) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-2 py-2 flex items-center justify-around">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === "overview" ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("opportunities")}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === "opportunities" ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Feed</span>
          </button>

          <button
            onClick={() => setActiveTab("ingest")}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-emerald-500 text-black shadow-lg shadow-emerald-950/50"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            onClick={() => setActiveTab("advisor")}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === "advisor" ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Advisor</span>
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] font-medium ${
              activeTab === "profile" ? "text-emerald-400" : "text-gray-400"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}

