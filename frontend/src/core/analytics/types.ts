// Amplitude-style Event Schema for Lovetism
// Tracks behavioral data for AI-powered personalization

export interface AnalyticsEvent {
  event_name: string
  user_id: string
  partner_id?: string
  timestamp: string
  session_id: string
  properties: Record<string, unknown>
}

// Event Types for the Relationship App
export type EventName =
  // Journal Events
  | 'journal_created'
  | 'journal_opened'
  | 'journal_entry_written'
  | 'journal_entry_viewed'
  | 'journal_photo_uploaded'
  
  // Mood & Sentiment Events
  | 'mood_logged'
  | 'sentiment_detected'
  
  // Date Ideas Events
  | 'date_idea_viewed'
  | 'date_idea_saved'
  | 'date_idea_dismissed'
  | 'date_completed'
  | 'ai_date_generated'
  | 'ai_date_accepted'
  
  // Engagement & Session Events
  | 'session_started'
  | 'session_ended'
  | 'partner_activity_viewed'
  
  // Behavioral Signals
  | 'inactivity_detected'
  | 'engagement_streak'

// Journal Entry with Mood Context
export interface JournalEntryData {
  journal_id: string
  entry_id: string
  word_count: number
  mood: MoodType
  energy_level: number // 1-5
  topics: string[] // AI-detected topics
  sentiment_score: number // -1 to 1
  has_photo: boolean
  writing_time_seconds: number
}

export type MoodType = 
  | 'happy' 
  | 'excited' 
  | 'content' 
  | 'romantic' 
  | 'thoughtful' 
  | 'stressed' 
  | 'sad' 
  | 'anxious'
  | 'grateful'
  | 'adventurous'

// Date Idea with AI Context
export interface DateIdeaData {
  idea_id: string
  title: string
  description: string
  category: DateCategory
  mood_match: MoodType[]
  energy_required: number // 1-5
  estimated_cost: 'free' | 'budget' | 'moderate' | 'expensive'
  duration_hours: number
  indoor_outdoor: 'indoor' | 'outdoor' | 'both'
  ai_reasoning?: string // Why AI suggested this
}

export type DateCategory =
  | 'adventure'
  | 'relaxation'
  | 'romantic'
  | 'creative'
  | 'food'
  | 'entertainment'
  | 'active'
  | 'learning'
  | 'social'
  | 'home'

// Partner Context for AI
export interface PartnerContext {
  user_id: string
  recent_mood: MoodType
  mood_trend: 'improving' | 'stable' | 'declining'
  recent_topics: string[]
  energy_level: number
  last_activity: string
  writing_frequency: 'daily' | 'weekly' | 'occasional' | 'rare'
}

// AI Date Suggestion Request
export interface DateSuggestionContext {
  user_context: PartnerContext
  partner_context: PartnerContext
  recent_dates_completed: string[] // To avoid repetition
  preferred_categories?: DateCategory[]
  budget_preference?: 'free' | 'budget' | 'moderate' | 'expensive'
  available_time?: number // hours
}
