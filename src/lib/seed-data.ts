import { Opportunity, OpportunityRegion, StudentProfile } from "@/types";

/**
 * Intentionally empty: CrestPath never injects dummy profiles or dummy opportunities.
 * All workspace data is strictly provided by the user.
 */
export const SEED_PROFILES: StudentProfile[] = [];
export const SEED_OPPORTUNITIES: Opportunity[] = [];

export const UGANDA_UNIVERSITIES: string[] = [
  "Makerere University",
  "Kyambogo University",
  "Mbarara University of Science & Technology (MUST)",
  "Busitema University",
  "Gulu University",
  "Uganda Christian University (UCU)",
  "Makerere University Business School (MUBS)",
  "Kabale University",
  "Lira University",
  "Soroti University",
  "Uganda Martyrs University",
  "ISBAT University",
  "Victoria University",
  "UTAMU University",
  "Mountains of the Moon University",
  "Nkumba University",
  "Kampala International University (KIU)",
  "Other University",
];

export const UGANDA_REGIONS: OpportunityRegion[] = [
  "Central",
  "Western",
  "Eastern",
  "Northern",
  "Nationwide",
];

export const UGANDA_CITIES_BY_REGION: Record<OpportunityRegion, string[]> = {
  Central: ["Kampala", "Entebbe", "Wakiso", "Mukono", "Masaka"],
  Western: ["Mbarara", "Kabale", "Fort Portal", "Hoima", "Bushenyi"],
  Eastern: ["Jinja", "Mbale", "Busitema", "Soroti", "Tororo"],
  Northern: ["Gulu", "Lira", "Arua", "Kitgum"],
  Nationwide: ["Remote / Online", "Multiple Cities"],
};

export const ALL_UGANDA_CITIES: string[] = [
  "Kampala",
  "Entebbe",
  "Wakiso",
  "Mukono",
  "Mbarara",
  "Kabale",
  "Fort Portal",
  "Jinja",
  "Mbale",
  "Busitema",
  "Gulu",
  "Lira",
  "Remote / Online",
];

export function createBlankProfile(id?: string): StudentProfile {
  return {
    id: id || `profile-${Date.now()}`,
    name: "",
    email: "",
    university: "",
    course: "",
    year_of_study: null,
    cgpa: "",
    avatarDataUrl: null,
    linkedinUrl: "",
    githubUrl: "",
    skills: [],
    interests: [],
    experience_summary: "",
  };
}
