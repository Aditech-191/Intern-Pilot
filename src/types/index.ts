export interface StudentProfile {
  id: string;
  name: string;
  university: string;
  course: string;
  year_of_study: number;
  skills: string[];
  interests: string[];
  experience_summary: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  deadline: string | null; // ISO YYYY-MM-DD
  eligibility: string;
  requirements: string[];
  link: string | null;
  summary: string;
  category: "Internship" | "Scholarship" | "Fellowship" | "Graduate Trainee";
  is_verified: boolean;
  created_at: string;
}

export interface ApplicationTracker {
  savedIds: string[];
  appliedIds: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  fallback?: boolean;
}

export interface ExtractedOpportunityData {
  title: string;
  organization: string;
  deadline: string | null;
  eligibility: string;
  requirements: string[];
  link: string | null;
  summary: string;
  category: "Internship" | "Scholarship" | "Fellowship" | "Graduate Trainee";
}

