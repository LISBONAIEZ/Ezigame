import { MAX_MONTHLY_POINTS } from '../lib/supabase'

export default function TeamCard({ team, members = [], allScores = [], rank = null }) {
  const teamScores = allScores.filter((s) => members.some((m) => m.id === s.user_id))
  const totalPoints = teamScores.reduce((sum, s) => sum + (s.points_earned || 0), 0)
  const maxPoints = members.length * MAX_MONTHLY_POINTS
  const percentage = maxPoints > 0 ? Math.min(100, Math.round((totalPoints / maxPoints) * 100)) : 0

  const avgPoints = members.length > 0 ? Math.round(totalPoints / members.length) : 0

  const getRankBadge = () => {
    if (!rank) return null
    if (rank === 1) return { emoji: '🥇', label: '1st Place', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' }
    if (rank === 2) return { emoji: '🥈', label: '2nd Place', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500' }
    if (rank === 3) return { emoji: '🥉', label: '3rd Place', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' }
    return { emoji: `#${rank}`, label: `${rank}th Place`, bg: 'bg-beige-50', border: 'border-beige-200', text: 'text-mauve-500' }
  }

  const badge = getRankBadge()

  // Top performers in team
  const memberPoints = members.map((m) => ({
    ...m,
    pts: allScores
      .filter((s) => s.user_id === m.id)
      .reduce((sum, s) => sum + (s.points_earned || 0), 0),
  })).sort((a, b) => b.pts - a.pts).slice(0, 3)

  return (
    <div className="bg-white rounded-2xl border border-beige-200 overflow-hidden hover:shadow-lg hover:border-pink-200 transition-all duration-300 hover:-translate-y-1">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-xl">
                🏆
              </div>
              <div>
                <h3 className="font-bold text-mauve-800 text-lg">{team.name}</h3>
                <p className="text-mauve-500 text-xs">{members.length} members</p>
              </div>
            </div>
            {team.description && (
              <p className="text-mauve-500 text-sm mt-2 leading-relaxed">{team.description}</p>
            )}
          </div>
          {badge && (
            <div className={`px-3 py-1.5 rounded-xl border ${badge.bg} ${badge.border} flex items-center gap-1.5 flex-shrink-0`}>
              <span className="text-base">{badge.emoji}</span>
              <span className={`text-xs font-semibold ${badge.text}`}>{badge.label}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total Points', value: totalPoints.toLocaleString(), icon: '⭐' },
            { label: 'Avg / Member', value: avgPoints, icon: '📊' },
            { label: 'Completion', value: `${percentage}%`, icon: '🎯' },
          ].map((stat) => (
            <div key={stat.label} className="bg-beige-50 rounded-xl p-3 text-center">
              <div className="text-base mb-1">{stat.icon}</div>
              <div className="text-lg font-bold text-mauve-800">{stat.value}</div>
              <div className="text-xs text-mauve-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-mauve-500 mb-1">
            <span>Team Progress</span>
            <span>{totalPoints} / {maxPoints} pts</span>
          </div>
          <div className="h-2.5 bg-beige-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top performers */}
      {memberPoints.length > 0 && (
        <div className="px-6 pb-6 border-t border-beige-100 pt-4">
          <p className="text-xs font-semibold text-mauve-500 uppercase tracking-wide mb-3">Top Performers</p>
          <div className="space-y-2">
            {memberPoints.map((member, i) => (
              <div key={member.id} className="flex items-center gap-3">
                <span className="text-sm w-5 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-pink-50 flex-shrink-0">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-pink-400 text-xs font-bold">
                      {member.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="flex-1 text-sm text-mauve-700 truncate">{member.full_name}</span>
                <span className="text-sm font-bold text-mauve-800">{member.pts} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
