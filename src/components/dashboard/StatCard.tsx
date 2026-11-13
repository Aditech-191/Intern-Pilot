import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  subtext: string;
  icon: LucideIcon;
  badge?: string;
  variant?: "emerald" | "amber" | "sky" | "purple";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  variant = "emerald",
  onClick,
}) => {
  const variantStyles = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    sky: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer border ${
        onClick ? "hover:scale-[1.02] active:scale-[0.98]" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-xl border ${variantStyles[variant]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {value}
          </span>
          {badge && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 truncate">{subtext}</p>
      </div>
    </div>
  );
};

