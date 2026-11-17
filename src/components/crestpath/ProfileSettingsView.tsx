"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { StudentProfile } from "@/types";
import { UGANDA_UNIVERSITIES } from "@/lib/seed-data";
import { ThemeMode, useTheme } from "@/lib/theme-context";

interface ProfileSettingsViewProps {
  profiles: StudentProfile[];
  activeProfile: StudentProfile;
  sessionEmail?: string | null;
  onSaveProfile: (profile: StudentProfile) => void;
  onSwitchProfile: (profileId: string) => void;
  onCreateProfile: () => void;
  onResetWorkspace: () => void;
}

export function ProfileSettingsView({
  profiles,
  activeProfile,
  sessionEmail,
  onSaveProfile,
  onSwitchProfile,
  onCreateProfile,
  onResetWorkspace,
}: ProfileSettingsViewProps) {
  const router = useRouter();
  const { mode, setMode } = useTheme();

  const [form, setForm] = useState<StudentProfile>(activeProfile);
  const [customUniversity, setCustomUniversity] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    const resolvedUniversity =
      universitySelectValue === "Other University"
        ? customUniversity.trim()
        : form.university.trim();

    onSaveProfile({
      ...form,
      name: form.name.trim(),
      university: resolvedUniversity,
      course: form.course.trim(),
      cgpa: form.cgpa?.trim() || "",
      experience_summary: form.experience_summary.trim(),
    });
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Profile &amp; Settings
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Your skills and academic details power live skill-alignment scores
            and advisor recommendations.
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

      {/* User-Created Profile Switcher (only shown if user has >1 profile) */}
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
                  university: val === "Other University" ? customUniversity : val,
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
        </div>

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
          <span className="text-xs font-medium text-strong">
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
