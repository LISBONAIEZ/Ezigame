import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Point categories with display names and colors
export const POINT_CATEGORIES = [
  { key: 'read_book', label: 'Read Book / Course / Automation', points: 10, icon: '📚', color: '#e8b4b8' },
  { key: 'slack_active', label: 'Active on Slack', points: 10, icon: '💬', color: '#f4a3b5' },
  { key: 'meetings_breaks', label: 'Active in Meetings & Power Breaks', points: 20, icon: '🤝', color: '#ed7a96' },
  { key: 'meet_kpis', label: 'Meet KPIs', points: 10, icon: '🎯', color: '#d4859a' },
  { key: 'agreement_doc', label: 'Agreement Doc Signed', points: 5, icon: '📝', color: '#c0607c' },
  { key: 'personal_pdi', label: 'Personal PDI', points: 10, icon: '🌱', color: '#b8a8b2' },
  { key: 'no_complaints', label: 'No Complaints', points: 10, icon: '⭐', color: '#e05578' },
]

export const MAX_MONTHLY_POINTS = POINT_CATEGORIES.reduce((sum, c) => sum + c.points, 0)

// Get current month as date string (first day of month)
export const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

// Format month for display
export const formatMonth = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Calculate total points from scores array
export const calcTotalPoints = (scores) =>
  scores.reduce((sum, s) => sum + (s.points_earned || 0), 0)
