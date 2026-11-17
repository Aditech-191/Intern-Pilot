export type UgandaRegion =
  | "All Uganda"
  | "Central"
  | "Western"
  | "Eastern"
  | "Northern"
  | "Nationwide";

export type OpportunityRegion = Exclude<UgandaRegion, "All Uganda">;

export type OpportunityCategory =
  | "Internship"
  | "Scholarship"
  | "Fellowship"
  | "Graduate Trainee";

export type ApplicationStatus =
  | "Not Started"
  | "Saved"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Accepted";

export type SortMode = "best_match" | "earliest_deadline" | "region";

export type TrackerFilter = "all" | "saved" | "applied" | "imported";

export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
  university: string;
  course: string;
  year_of_study: number | null;
  cgpa?: string;
  skills: string[];
  interests: string[];
  experience_summary: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  region: OpportunityRegion;
  city: string;
  stipend?: string | null;
  deadline: string | null; // ISO YYYY-MM-DD
  eligibility: string;
  requirements: string[];
  link: string | null;
  summary: string;
  category: OpportunityCategory;
  is_verified: boolean;
  source?: "parsed" | "manual";
  warnings?: string[];
  created_at: string;
}

export interface OpportunityTracking {
  status: ApplicationStatus;
  saved: boolean;
  notes: string;
  checkedRequirements: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citedOpportunityIds?: string[];
  timestamp: string;
  error?: boolean;
}

export interface ExtractedOpportunityData {
  title: string;
  organization: string;
  category: OpportunityCategory;
  region: OpportunityRegion;
  city: string;
  location: string;
  deadline: string | null;
  stipend: string | null;
  eligibility: string;
  requirements: string[];
  link: string | null;
  summary: string;
  warnings: string[];
}
