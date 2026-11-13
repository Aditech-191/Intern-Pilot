import { Opportunity, StudentProfile } from "@/types";
import { SEED_OPPORTUNITIES, SEED_PROFILES } from "./seed-data";
import { createClient } from "@supabase/supabase-js";

// In-memory persistent cache for zero-config local run
let memoryOpportunities: Opportunity[] = [...SEED_OPPORTUNITIES];
let memoryProfiles: StudentProfile[] = [...SEED_PROFILES];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("placeholder")
);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!)
  : null;

export async function getOpportunities(): Promise<Opportunity[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("deadline", { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Opportunity[];
      }
    } catch (err) {
      console.warn("Supabase fetch failed, falling back to local memory store:", err);
    }
  }

  // Local in-memory fallback
  return [...memoryOpportunities];
}

export async function addOpportunity(
  newOpp: Omit<Opportunity, "id" | "created_at">
): Promise<Opportunity> {
  const opportunity: Opportunity = {
    ...newOpp,
    id: `opp-custom-${Date.now()}`,
    created_at: new Date().toISOString().split("T")[0],
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .insert([opportunity])
        .select()
        .single();

      if (!error && data) {
        memoryOpportunities.unshift(data as Opportunity);
        return data as Opportunity;
      }
    } catch (err) {
      console.warn("Supabase insert failed, storing in memory:", err);
    }
  }

  memoryOpportunities.unshift(opportunity);
  return opportunity;
}

export async function getProfiles(): Promise<StudentProfile[]> {
  return [...memoryProfiles];
}

export async function saveProfile(profile: StudentProfile): Promise<StudentProfile> {
  const index = memoryProfiles.findIndex((p) => p.id === profile.id);
  if (index >= 0) {
    memoryProfiles[index] = profile;
  } else {
    memoryProfiles.push(profile);
  }
  return profile;
}

