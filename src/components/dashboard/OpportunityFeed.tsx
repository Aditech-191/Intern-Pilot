import React, { useState, useMemo } from "react";
import { Opportunity, StudentProfile } from "@/types";
import { OpportunityCard } from "./OpportunityCard";
import { Sparkles, Bookmark, CheckCircle2, ListFilter, Search } from "lucide-react";

interface OpportunityFeedProps {
  opportunities: Opportunity[];
  student: StudentProfile;
  savedIds: string[];
  appliedIds: string[];
  onToggleSave: (id: string) => void;
  onToggleApplied: (id: string) => void;
  onAskAboutOpportunity: (opportunity: Opportunity) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenIngest: () => void;
}

type FeedFilter = "all" | "match" | "saved" | "applied";

export const OpportunityFeed: React.FC<OpportunityFeedProps> = ({
  opportunities,
  student,
  savedIds,
  appliedIds,
  onToggleSave,
  onToggleApplied,
  onAskAboutOpportunity,
  searchQuery,
  setSearchQuery,
  onOpenIngest,
}) => {
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Internship", "Scholarship", "Graduate Trainee", "Fellowship"];

  // Filter pipeline
  const filteredList = useMemo(() => {
    const studentSkillsLower = student.skills.map((s) => s.toLowerCase());
    const query = searchQuery.toLowerCase().trim();

    return opportunities.filter((opp) => {
      // 1. Tab filter
      if (activeFilter === "saved" && !savedIds.includes(opp.id)) return false;
      if (activeFilter === "applied" && !appliedIds.includes(opp.id)) return false;
      if (activeFilter === "match") {
        const hasMatch = opp.requirements.some((req) =>
          studentSkillsLower.some((s) => req.toLowerCase().includes(s) || s.includes(req.toLowerCase()))
        );
        if (!hasMatch) return false;
      }

      // 2. Category filter
      if (selectedCategory !== "All" && opp.category !== selectedCategory) return false;

      // 3. Search query
      if (query) {
        const inTitle = opp.title.toLowerCase().includes(query);
        const inOrg = opp.organization.toLowerCase().includes(query);
        const inLoc = opp.location.toLowerCase().includes(query);
        const inReq = opp.requirements.some((r) => r.toLowerCase().includes(query));
        if (!inTitle && !inOrg && !inLoc && !inReq) return false;
      }

      return true;
    });
  }, [opportunities, student, activeFilter, selectedCategory, searchQuery, savedIds, appliedIds]);

  return (
    <div className="space-y-5">
      {/* Feed Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface/90 border border-white/5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
              activeFilter === "all"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Listings ({opportunities.length})
          </button>

          <button
            onClick={() => setActiveFilter("match")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === "match"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Best Match
          </button>

          <button
            onClick={() => setActiveFilter("saved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === "saved"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Saved ({savedIds.length})
          </button>

          <button
            onClick={() => setActiveFilter("applied")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 shrink-0 ${
              activeFilter === "applied"
                ? "bg-emerald-500 text-black font-bold shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Applied ({appliedIds.length})
          </button>
        </div>

        {/* Category Pill Strip */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <ListFilter className="w-3.5 h-3.5 text-gray-500 mr-1 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] px-2.5 py-1 rounded-lg transition-all shrink-0 border ${
                selectedCategory === cat
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-surface text-gray-400 border-white/5 hover:border-white/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Listings */}
      {filteredList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredList.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              student={student}
              isSaved={savedIds.includes(opp.id)}
              isApplied={appliedIds.includes(opp.id)}
              onToggleSave={onToggleSave}
              onToggleApplied={onToggleApplied}
              onAskAbout={onAskAboutOpportunity}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center border border-white/5 my-6">
          <Search className="w-10 h-10 text-gray-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No matching opportunities found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            {activeFilter === "saved"
              ? "You haven't bookmarked any listings yet. Click the bookmark icon on any card to save it."
              : activeFilter === "applied"
              ? "You haven't marked any applications as sent yet. Track your pipeline here."
              : "Try adjusting your search terms or category filter, or paste a new listing from WhatsApp."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {activeFilter !== "all" && (
              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold glass-button"
              >
                Reset Filters
              </button>
            )}
            <button
              onClick={onOpenIngest}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400"
            >
              + Ingest New Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
