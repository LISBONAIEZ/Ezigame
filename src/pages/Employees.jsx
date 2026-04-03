import { useState, useMemo } from 'react'
import { useEmployees, useTeams, useMonthlyScores } from '../hooks/useData'
import EmployeeCard from '../components/EmployeeCard'

export default function Employees() {
  const { employees, loading: empLoading } = useEmployees()
  const { teams } = useTeams()
  const { scores, loading: scoresLoading } = useMonthlyScores()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')

  const loading = empLoading || scoresLoading

  const employeesWithPoints = useMemo(() =>
    employees.map((emp) => ({
      ...emp,
      pts: scores.filter((s) => s.user_id === emp.id).reduce((sum, s) => sum + (s.points_earned || 0), 0),
      empScores: scores.filter((s) => s.user_id === emp.id),
    })),
    [employees, scores]
  )

  const filtered = useMemo(() => {
    let list = employeesWithPoints
    if (search) list = list.filter((e) => e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.role?.toLowerCase().includes(search.toLowerCase()))
    if (teamFilter !== 'all') list = list.filter((e) => e.team_id === teamFilter)
    if (sortBy === 'points') list = [...list].sort((a, b) => b.pts - a.pts)
    else if (sortBy === 'name') list = [...list].sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    else if (sortBy === 'joined') list = [...list].sort((a, b) => new Date(a.joined_at) - new Date(b.joined_at))
    return list
  }, [employeesWithPoints, search, teamFilter, sortBy])

  // For ranking
  const rankedIds = useMemo(() =>
    [...employeesWithPoints].sort((a, b) => b.pts - a.pts).map((e) => e.id),
    [employeesWithPoints]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-mauve-800">Employees</h1>
        <p className="text-mauve-500 text-sm mt-1">{employees.length} team members</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-mauve-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-beige-200 bg-white text-sm text-mauve-800
              placeholder:text-mauve-400 focus:border-pink-300 transition-all"
          />
        </div>

        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-beige-200 bg-white text-sm text-mauve-700
            focus:border-pink-300 transition-all"
        >
          <option value="all">All Teams</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-beige-200 bg-white text-sm text-mauve-700
            focus:border-pink-300 transition-all"
        >
          <option value="points">Sort: Points</option>
          <option value="name">Sort: Name</option>
          <option value="joined">Sort: Tenure</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 skeleton rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-mauve-600 font-medium">No employees found</p>
          <p className="text-mauve-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              scores={emp.empScores}
              rank={sortBy === 'points' ? rankedIds.indexOf(emp.id) + 1 : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
