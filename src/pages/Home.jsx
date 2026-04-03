import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEmployees, useTeams, useMonthlyScores } from '../hooks/useData'
import { MAX_MONTHLY_POINTS, POINT_CATEGORIES, formatMonth, getCurrentMonth } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card rounded-xl px-4 py-2 shadow-lg">
        <p className="text-xs text-mauve-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-mauve-800">{payload[0].value} pts</p>
      </div>
    )
  }
  return null
}

export default function Home() {
  const { profile, isAdmin } = useAuth()
  const { employees } = useEmployees()
  const { teams } = useTeams()
  const { scores, loading: scoresLoading } = useMonthlyScores()

  const currentMonth = getCurrentMonth()

  // My scores
  const myScores = useMemo(() =>
    scores.filter((s) => s.user_id === profile?.id),
    [scores, profile]
  )
  const myPoints = myScores.reduce((sum, s) => sum + (s.points_earned || 0), 0)
  const myPercentage = Math.min(100, Math.round((myPoints / MAX_MONTHLY_POINTS) * 100))

  // Top employees
  const topEmployees = useMemo(() => {
    return employees
      .map((emp) => ({
        ...emp,
        pts: scores.filter((s) => s.user_id === emp.id).reduce((sum, s) => sum + (s.points_earned || 0), 0),
      }))
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5)
  }, [employees, scores])

  // Team leaderboard
  const teamLeaderboard = useMemo(() => {
    return teams
      .map((team) => {
        const teamMembers = employees.filter((e) => e.team_id === team.id)
        const pts = scores
          .filter((s) => teamMembers.some((m) => m.id === s.user_id))
          .reduce((sum, s) => sum + (s.points_earned || 0), 0)
        return { ...team, pts, memberCount: teamMembers.length }
      })
      .sort((a, b) => b.pts - a.pts)
      .slice(0, 5)
  }, [teams, employees, scores])

  // My radar data
  const myRadarData = POINT_CATEGORIES.map((cat) => {
    const score = myScores.find((s) => s.point_categories?.name === cat.key)
    return {
      subject: cat.label.split(' ').slice(0, 2).join(' '),
      value: score?.points_earned || 0,
      max: cat.points,
    }
  })

  // My rank
  const myRank = useMemo(() => {
    const sorted = employees
      .map((e) => ({ id: e.id, pts: scores.filter((s) => s.user_id === e.id).reduce((sum, s) => sum + s.points_earned, 0) }))
      .sort((a, b) => b.pts - a.pts)
    return sorted.findIndex((e) => e.id === profile?.id) + 1
  }, [employees, scores, profile])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mauve-800">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-mauve-500 text-sm mt-1">{formatMonth(currentMonth)} · Company Dashboard</p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
          >
            ⚙️ Admin Panel
          </Link>
        )}
      </div>

      {/* My Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'My Points', value: myPoints, sub: `of ${MAX_MONTHLY_POINTS}`, icon: '⭐', color: 'from-pink-100 to-rose-100' },
          { label: 'My Rank', value: myRank > 0 ? `#${myRank}` : '—', sub: `of ${employees.length}`, icon: '🏆', color: 'from-amber-50 to-yellow-50' },
          { label: 'Completion', value: `${myPercentage}%`, sub: 'this month', icon: '🎯', color: 'from-beige-100 to-pink-50' },
          { label: 'My Team', value: profile?.teams?.name || '—', sub: 'current team', icon: '👥', color: 'from-rose-50 to-pink-50' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 border border-beige-200`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-xs text-mauve-400">{stat.sub}</span>
            </div>
            <p className="text-2xl font-bold text-mauve-800 leading-none">{stat.value}</p>
            <p className="text-xs text-mauve-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* My progress bar */}
      <div className="bg-white rounded-2xl border border-beige-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-mauve-800">My Monthly Progress</h2>
          <span className="text-sm font-bold text-pink-500">{myPoints} pts</span>
        </div>
        <div className="h-3 bg-beige-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full transition-all duration-700"
            style={{ width: `${myPercentage}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
          {POINT_CATEGORIES.map((cat) => {
            const score = myScores.find((s) => s.point_categories?.name === cat.key)
            const earned = score?.points_earned || 0
            const full = earned >= cat.points
            return (
              <div
                key={cat.key}
                className={`rounded-xl p-2.5 text-center border transition-all ${full ? 'bg-pink-50 border-pink-200' : 'bg-beige-50 border-beige-200'}`}
                title={cat.label}
              >
                <div className="text-lg mb-0.5">{cat.icon}</div>
                <div className={`text-xs font-bold ${full ? 'text-pink-500' : 'text-mauve-600'}`}>
                  {earned}/{cat.points}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top 5 employees bar chart */}
        <div className="bg-white rounded-2xl border border-beige-200 p-6">
          <h2 className="font-semibold text-mauve-800 mb-4">🥇 Top Employees</h2>
          {scoresLoading ? (
            <div className="h-48 skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topEmployees.map((e) => ({ name: e.full_name?.split(' ')[0], pts: e.pts }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5ede8" />
                <XAxis dataKey="name" tick={{ fill: '#9a8490', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9a8490', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="pts" fill="#e8b4b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team leaderboard */}
        <div className="bg-white rounded-2xl border border-beige-200 p-6">
          <h2 className="font-semibold text-mauve-800 mb-4">🏆 Team Leaderboard</h2>
          {teamLeaderboard.length === 0 ? (
            <p className="text-mauve-400 text-sm text-center py-8">No teams yet</p>
          ) : (
            <div className="space-y-3">
              {teamLeaderboard.map((team, i) => {
                const maxPts = (teamLeaderboard[0]?.pts || 1)
                const pct = Math.round((team.pts / maxPts) * 100)
                return (
                  <div key={team.id} className="flex items-center gap-3">
                    <span className="text-base w-5 text-center flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-mauve-700">{team.name}</span>
                        <span className="text-sm font-bold text-mauve-800">{team.pts} pts</span>
                      </div>
                      <div className="h-1.5 bg-beige-100 rounded-full">
                        <div
                          className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-mauve-400 w-8 text-right">{team.memberCount}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/employees', icon: '👥', label: 'View All Employees', sub: `${employees.length} members`, color: 'from-pink-50 to-rose-50 border-pink-100 hover:border-pink-200' },
          { to: '/teams', icon: '🏆', label: 'Browse Teams', sub: `${teams.length} teams`, color: 'from-beige-100 to-pink-50 border-beige-200 hover:border-pink-200' },
          { to: '/leaderboard', icon: '📊', label: 'Full Leaderboard', sub: 'See all rankings', color: 'from-rose-50 to-beige-100 border-rose-100 hover:border-pink-200' },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`bg-gradient-to-br ${link.color} rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
          >
            <span className="text-3xl block mb-2">{link.icon}</span>
            <p className="font-semibold text-mauve-800 text-sm">{link.label}</p>
            <p className="text-mauve-400 text-xs mt-0.5">{link.sub}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
