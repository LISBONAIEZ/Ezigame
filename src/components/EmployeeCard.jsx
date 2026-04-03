import { useState } from 'react'
import { POINT_CATEGORIES, MAX_MONTHLY_POINTS } from '../lib/supabase'

export default function EmployeeCard({ employee, scores = [], rank = null }) {
  const [expanded, setExpanded] = useState(false)

  const totalPoints = scores.reduce((sum, s) => sum + (s.points_earned || 0), 0)
  const percentage = Math.min(100, Math.round((totalPoints / MAX_MONTHLY_POINTS) * 100))

  const getInitials = (name) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const getYearsAtCompany = (joinedAt) => {
    if (!joinedAt) return 'N/A'
    const years = ((Date.now() - new Date(joinedAt)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
    return years < 1 ? `${Math.round(years * 12)}mo` : `${years}yr`
  }

  const getRankBadge = () => {
    if (!rank) return null
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500' }
    if (rank === 2) return { emoji: '🥈', color: 'text-slate-400' }
    if (rank === 3) return { emoji: '🥉', color: 'text-amber-600' }
    return { emoji: `#${rank}`, color: 'text-mauve-500' }
  }

  const rankBadge = getRankBadge()

  return (
    <div
      className="bg-white rounded-2xl border border-beige-200 overflow-hidden
        hover:shadow-lg hover:border-pink-200 transition-all duration-300 hover:-translate-y-1 group"
    >
      {/* Header gradient */}
      <div className="h-16 bg-gradient-to-r from-pink-100 via-rose-50 to-beige-200 relative">
        {rankBadge && (
          <div className={`absolute top-3 right-3 text-lg font-bold ${rankBadge.color}`}>
            {rankBadge.emoji}
          </div>
        )}
      </div>

      {/* Photo */}
      <div className="px-5 -mt-8 pb-4">
        <div className="flex items-end gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl border-3 border-white shadow-md overflow-hidden bg-pink-50 flex-shrink-0"
            style={{ border: '3px solid white' }}>
            {employee.photo_url ? (
              <img src={employee.photo_url} alt={employee.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-pink-400 font-bold text-xl bg-gradient-to-br from-pink-100 to-rose-100">
                {getInitials(employee.full_name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h3 className="font-semibold text-mauve-800 text-base truncate group-hover:text-pink-500 transition-colors">
              {employee.full_name || 'Unknown'}
            </h3>
            <p className="text-mauve-500 text-xs truncate">{employee.role || 'Employee'}</p>
          </div>
        </div>

        {/* Points bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-mauve-500 font-medium">Monthly Points</span>
            <span className="text-sm font-bold text-mauve-800">{totalPoints} / {MAX_MONTHLY_POINTS}</span>
          </div>
          <div className="h-2 bg-beige-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-mauve-400">{percentage}% complete</span>
            {employee.teams?.name && (
              <span className="text-xs text-pink-400 font-medium">{employee.teams.name}</span>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-beige-50 rounded-xl p-2.5 text-center">
            <p className="text-mauve-400 text-xs mb-0.5">Time Here</p>
            <p className="text-mauve-800 text-sm font-semibold">{getYearsAtCompany(employee.joined_at)}</p>
          </div>
          <div className="bg-beige-50 rounded-xl p-2.5 text-center">
            <p className="text-mauve-400 text-xs mb-0.5">Team</p>
            <p className="text-mauve-800 text-sm font-semibold truncate">{employee.teams?.name || '—'}</p>
          </div>
        </div>

        {/* Bio */}
        {employee.bio && (
          <p className="text-mauve-500 text-xs leading-relaxed line-clamp-2 mb-3">{employee.bio}</p>
        )}

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-pink-400 hover:text-pink-500 font-medium flex items-center justify-center gap-1 py-1 transition-colors"
        >
          {expanded ? 'Hide breakdown ↑' : 'View point breakdown ↓'}
        </button>

        {/* Point breakdown */}
        {expanded && (
          <div className="mt-3 space-y-2 animate-fade-in">
            {POINT_CATEGORIES.map((cat) => {
              const score = scores.find((s) => s.point_categories?.name === cat.key)
              const earned = score?.points_earned || 0
              return (
                <div key={cat.key} className="flex items-center gap-2">
                  <span className="text-sm">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs text-mauve-600 truncate">{cat.label}</span>
                      <span className="text-xs font-medium text-mauve-800 ml-2 flex-shrink-0">
                        {earned}/{cat.points}
                      </span>
                    </div>
                    <div className="h-1 bg-beige-100 rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (earned / cat.points) * 100)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
