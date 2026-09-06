// Backend API types (mirrors the FastAPI schemas).

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  role: "user" | "counselor" | "admin";
  is_active: boolean;
  is_anonymous?: boolean;
  onboarding_completed: boolean;
  preferred_name?: string | null;
  wellness_goals?: string[] | null;
  preferred_style?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Pick<ApiUser, "id" | "email" | "username" | "role" | "onboarding_completed">;
}

export interface EmotionInfo {
  emotion: string;
  confidence: number;
  severity?: string;
}

export interface IntentInfo {
  intent: string;
  confidence: number;
  matched_patterns?: string[];
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  emotion?: EmotionInfo | null;
  intent?: IntentInfo | null;
  suggested_actions?: string[];
  is_crisis?: boolean;
  crisis_severity?: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  emotion_detected?: string | null;
  intent_detected?: string | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: "very_good" | "good" | "neutral" | "low" | "very_low";
  stress_level: number;
  anxiety_level: number;
  note?: string | null;
  created_at: string;
}

export interface MoodHistory {
  logs: MoodLog[];
  total: number;
  average_stress?: number | null;
  average_anxiety?: number | null;
  mood_distribution?: Record<string, number> | null;
}

export interface MoodDistribution {
  mood: MoodLog["mood"];
  moodValue: number; // 0.0-1.0 rank used by charts
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood?: string | null;
  emotion_analysis?: unknown | null;
  word_count: number;
  writing_prompt?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WellnessExercise {
  id: string;
  title: string;
  category:
    | "breathing"
    | "grounding"
    | "mindfulness"
    | "stress_relief"
    | "cbt"
    | "sleep"
    | "positive_reflection";
  description: string;
  instructions: string[];
  duration_minutes: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  is_active: boolean;
  created_at: string;
}

export interface WellnessSession {
  id: string;
  user_id: string;
  exercise_id: string;
  completed: boolean;
  duration_seconds: number;
  notes?: string | null;
  created_at: string;
  exercise?: WellnessExercise | null;
}

export interface MedicineInfo {
  id: string;
  name: string;
  generic_name?: string | null;
  category?: string | null;
  common_uses?: string | null;
  description?: string | null;
  side_effects?: string[] | null;
  warnings?: string[] | null;
  precautions?: string[] | null;
  administration_info?: Record<string, unknown> | null;
  interaction_warnings?: string[] | null;
  source?: string | null;
  last_updated?: string | null;
}

export interface MedicineList {
  medicines: MedicineInfo[];
  total: number;
}

export interface EmergencyResource {
  id: string;
  country: string;
  region?: string | null;
  organization: string;
  emergency_number?: string | null;
  crisis_helpline?: string | null;
  website?: string | null;
  availability?: string | null;
  description?: string | null;
  last_verified?: string | null;
}

export interface CrisisAnalysis {
  is_crisis: boolean;
  severity: string;
  crisis_type: string;
  confidence: number;
  score: number;
}

export interface Counselor {
  id: string;
  user_id: string;
  full_name?: string | null;
  specialty: string;
  experience_years: number;
  bio?: string | null;
  location?: string | null;
  availability?: Record<string, unknown> | null;
  is_online: boolean;
  rating: number;
  consultation_fee?: number | null;
  is_active: boolean;
}

export interface CounselorRequest {
  id: string;
  user_id: string;
  counselor_id: string;
  status: string;
  message?: string | null;
  created_at: string;
  updated_at: string;
  counselor?: Counselor | null;
}

export interface PrivacySettings {
  share_mood_data: boolean;
  share_journal: boolean;
  allow_analytics: boolean;
  data_retention_days: number;
}

export interface AdminAnalytics {
  total_users: number;
  total_conversations: number;
  total_messages: number;
  total_mood_logs: number;
  total_journal_entries: number;
  total_crisis_events: number;
  total_wellness_sessions: number;
  active_users_today: number;
  total_counselors: number;
}

export const MOOD_LABELS: Record<string, string> = {
  very_good: "Very Good",
  good: "Good",
  neutral: "Neutral",
  low: "Low",
  very_low: "Very Low",
};

export const MOOD_EMOJI: Record<string, string> = {
  very_good: "😊",
  good: "🙂",
  neutral: "😐",
  low: "😔",
  very_low: "😢",
};

/** Mood rank 0..4 used for charts: very_low(0) .. very_good(4). */
export const MOOD_RANK: Record<string, number> = {
  very_low: 0,
  low: 1,
  neutral: 2,
  good: 3,
  very_good: 4,
};

export const MOOD_ORDER = ["very_good", "good", "neutral", "low", "very_low"] as const;

export const WELLNESS_CATEGORIES: Record<string, string> = {
  breathing: "Breathing",
  grounding: "Grounding",
  mindfulness: "Mindfulness",
  stress_relief: "Stress Relief",
  cbt: "CBT-Inspired",
  sleep: "Sleep & Wind-Down",
  positive_reflection: "Positive Reflection",
};

export const MEDICINE_CATEGORIES: Record<string, string> = {
  antidepressant: "Antidepressant",
  antipsychotic: "Antipsychotic",
  anxiolytic: "Anxiolytic",
  sedative: "Sedative",
  stimulant: "Stimulant",
  mood_stabilizer: "Mood stabilizer",
  sleep: "Sleep aid",
  pain: "Pain relief",
  general: "General",
};

export const GOALS_OPTIONS = [
  "Reduce stress",
  "Manage anxiety",
  "Improve sleep",
  "Track emotions",
  "Build healthy habits",
  "Journal",
  "Learn about mental wellness",
];

export const JOURNAL_PROMPTS = [
  "What was one thing that made today difficult?",
  "What went well today?",
  "What are you grateful for?",
  "What's on your mind right now?",
];