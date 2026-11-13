import React from "react";
import {
  LayoutDashboard,
  Briefcase,
  Bot,
  PlusCircle,
  User,
  Compass,
  Radio,
} from "lucide-react";

export type TabType = "overview" | "opportunities" | "advisor" | "ingest" | "profile";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  openAdvisorDrawer?: () => void;
  openIngestModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems = [
    { id: "overview" as TabType, label: "Overview", icon: LayoutDashboard },
    { id: "opportunities" as TabType, label: "Opportunities", icon: Briefcase },
    { id: "advisor" as TabType, label: "AI Advisor", icon: Bot, badge: "Gemini" },
    { id: "ingest" as TabType, label: "Ingest Post", icon: PlusCircle },
    { id: "profile" as TabType, label: "Student Profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 p-4 justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-950/60 text-black">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">InternPilot</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                UG
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Uganda Career Hub</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/30"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-emerald-400" : "text-gray-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Network / Low Bandwidth Status Pill */}
      <div className="p-3 rounded-xl bg-surface/90 border border-white/5 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Local Node Active</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          Optimized for Makerere, Kyambogo & Uganda telecos.
        </p>
      </div>
    </aside>
  );
};

