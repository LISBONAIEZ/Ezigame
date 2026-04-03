import { useState, useMemo } from 'react'
import { useEmployees, useTeams, useMonthlyScores, useAvailableMonths } from '../hooks/useData'
import { MAX_MONTHLY_POINTS, POINT_CATEGORIES, formatMonth, getCurrentMonth } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-2 shadow-lg">
        <p className="text-xs text-mauve-500 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>{p.value} pts</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Leaderboard() {
  const { employees } = useEmployees()
  const { teams } = useTeams()
  const availableMonths = useAvailableMonths()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [view, setView] = useState('individual') // 'individual' | 'team' | 'category'
  const { scores, loading } = useMonthlyScores(selectedMonth)

  // Individual leaderboard
  const individualRanking = useMemo(() =>
    employees
      .map((emp) => ({
        ...emp,
        pts: scores.filter((s) => s.user_id === emp.id).reduce((sum, s) => sum + (s.points_earned || 0), 0),
      }))
      .sort((a, b) => b.pts - a.pts),
    [employees, scores]
  )

  // Team leaderboard
  const teamRanking = useMemo(() =>
    teams
      .map((team) => {
        const members = employees.filter((e) => e.team_id === team.id)
        const pts = scores
          .filter((s) => members.some((m) => m.id === s.user_id))
          .reduce((sum, s) => sum + (s.points_earned || 0), 0)
        return { ...team, pts, members: members.length }
      })
      .sort((a, b) => b.pts - a.pts),
    [teams, employees, scores]
  )

  // Category breakdown
  const categoryBreakdown = useMemo(() =>
    POINT_CATEGORIES.map((cat) => {
      const catScores = scores.filter((s) => s.point_categories?.name === cat.key)
      const total = catScores.reduce((sum, s) => sum + (s.points_earned || 0), 0)
      const max = employees.length * cat.points
      return {
        name: cat.label.split(' ').slice(0, 3).join(' '),
        total,
        max,
        pct: max > 0 ? Math.round((total / max) * 100) : 0,
        icon: cat.icon,
      }
    }),
    [scores, employees]
  )

  const allMonths = [getCurrentMonth(), ...availableMonths.filter((m) => m !== getCurrentMonth())]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mauve-800">Leaderboard</h1>
          <p className="text-mauve-500 text-sm mt-1">Company-wide performance rankings</p>
        </div>

        {/* Month picker */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-beige-200 bg-white text-sm text-mauve-700 focus:border-pink-300 transition-all"
        >
          {allMonths.map((m) => (
            <option key={m} value={m}>{formatMonth(m)}{m === getCurrentMonth() ? ' (current)' : ''}</option>
          ))}
        </select>
      </div>

      {/* View toggle */}
      <div className="flex bg-white border border-beige-200 rounded-2xl p-1 w-fit">
        {[
          { id: 'individual', label: '👤 Individual' },
          { id: 'team', label: '🏆 Team' },
          { id: 'category', label: '📊 Categories' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${view === tab.id ? 'bg-pink-50 text-pink-500 shadow-sm' : 'text-mauve-500 hover:text-mauve-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <>
          {view === 'individual' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="bg-white rounded-2xl border border-beige-200 p-6">
                <h2 className="font-semibold text-mauve-800 mb-4">Points Distribution</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={individualRanking.slice(0, 10).map((e) => ({ name: e.full_name?.split(' ')[0], pts: e.pts }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5ede8" />
                    <XAxis dataKey="name" tick={{ fill: '#9a8490', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9a8490', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pts" fill="url(#pinkGrad)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f4a3b5" />
                        <stop offset="100%" stopColor="#e8b4b8" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ranking list */}
              <div className="bg-white rounded-2xl border border-beige-200 p-6">
                <h2 className="font-semibold text-mauve-800 mb-4">Full Ranking</h2>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {individualRanking.map((emp, i) => {
                    const pct = Math.min(100, Math.round((emp.pts / MAX_MONTHLY_POINTS) * 100))
                    return (
                      <div key={emp.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                        ${i < 3 ? 'bg-pink-50 border border-pink-100' : 'hover:bg-beige-50'}`}>
                        <span className="text-sm w-6 text-center font-bold text-mauve-500">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-pink-50 flex-shrink-0">
                          {emp.photo_url ? (
                            <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-pink-400 text-xs font-bold">
                              {emp.full_name?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-mauve-700 truncate">{emp.full_name}</span>
                            <span className="text-sm font-bold text-mauve-800 ml-2 flex-shrink-0">{emp.pts}</span>
                          </div>
                          <div className="h-1 bg-beige-100 rounded-full">
                            <div className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {view === 'team' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-beige-200 p-6">
                <h2 className="font-semibold text-mauve-800 mb-4">Team Points</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={teamRanking.map((t) => ({ name: t.name, pts: t.pts }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5ede8" />
                    <XAxis dataKey="name" tick={{ fill: '#9a8490', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9a8490', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pts" fill="#e8b4b8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-beige-200 p-6">
                <h2 className="font-semibold text-mauve-800 mb-4">Team Rankings</h2>
                <div className="space-y-3">
                  {teamRanking.map((team, i) => (
                    <div key={team.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-colors
                      ${i === 0 ? 'bg-yellow-50 border-yellow-200' : i === 1 ? 'bg-slate-50 border-slate-200' : i === 2 ? 'bg-amber-50 border-amber-200' : 'bg-beige-50 border-beige-200'}`}>
                      <span className="text-xl w-7 text-center">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold text-mauve-800 text-sm">{team.name}</p>
                        <p className="text-mauve-400 text-xs">{team.members} members</p>
                      </div>
                      <p className="text-lg font-bold text-mauve-800">{team.pts} <span className="text-xs text-mauve-400">pts</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'category' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-beige-200 p-6">
                <h2 className="font-semibold text-mauve-800 mb-4">Category Performance</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5ede8" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#9a8490', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9a8490', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" fill="#f4a3b5" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-beige-200 p-6">
                <h2 className="font-semibold text-mauve-800 mb-4">Completion by Category</h2>
                <div className="space-y-4">
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-mauve-700">{cat.icon} {cat.name}</span>
                        <span className="text-sm font-bold text-mauve-800">{cat.pct}%</span>
                      </div>
                      <div className="h-2 bg-beige-100 rounded-full">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-pink-300 to-rose-400"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
