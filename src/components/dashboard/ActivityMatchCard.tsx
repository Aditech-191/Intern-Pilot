import React from "react";
import { Sparkles, ArrowUpRight, Calendar, Compass } from "lucide-react";
import { Opportunity, StudentProfile } from "@/types";

interface ActivityMatchCardProps {
  opportunities: Opportunity[];
  student: StudentProfile;
  onExploreMatches: () => void;
}

export const ActivityMatchCard: React.FC<ActivityMatchCardProps> = ({
  opportunities,
  student,
  onExploreMatches,
}) => {
  // Calculate match distribution
  const studentSkillsLower = student.skills.map((s) => s.toLowerCase());

  const matchedOpps = opportunities.filter((opp) =>
    opp.requirements.some((req) =>
      studentSkillsLower.some((s) => req.toLowerCase().includes(s) || s.includes(req.toLowerCase()))
    )
  );

  // Group upcoming deadlines
  const urgentCount = opportunities.filter((o) => {
    if (!o.deadline) return false;
    const daysLeft = Math.ceil((new Date(o.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return daysLeft >= 0 && daysLeft <= 7;
  }).length;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between border">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Skill Alignment & Deadlines</h3>
              <p className="text-xs text-gray-400">Based on your {student.course} profile</p>
            </div>
          </div>
          <button
            onClick={onExploreMatches}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View {matchedOpps.length} Matches
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual match sparkline / bars */}
        <div className="space-y-3 my-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium">Full Stack & Web Roles</span>
              <span className="text-emerald-400 font-semibold">92% Match</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface border border-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[92%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium">Fintech & Backend Systems</span>
              <span className="text-emerald-400 font-semibold">78% Match</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface border border-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 w-[78%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300 font-medium">Cloud & DevOps Apprenticeships</span>
              <span className="text-amber-400 font-semibold">54% Match</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface border border-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 w-[54%]" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-rose-400" />
          <span>
            <strong className="text-rose-400 font-medium">{urgentCount} opportunities</strong> closing within 7 days
          </span>
        </div>
        <button
          onClick={onExploreMatches}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 font-medium flex items-center gap-1 transition-all"
        >
          <Compass className="w-3.5 h-3.5" />
          Explore Matches
        </button>
      </div>
    </div>
  );
};

