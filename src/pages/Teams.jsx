import { useMemo } from 'react'
import { useEmployees, useTeams, useMonthlyScores } from '../hooks/useData'
import TeamCard from '../components/TeamCard'

export default function Teams() {
  const { employees, loading: empLoading } = useEmployees()
  const { teams, loading: teamsLoading } = useTeams()
  const { scores, loading: scoresLoading } = useMonthlyScores()

  const loading = empLoading || teamsLoading || scoresLoading

  const teamsWithPoints = useMemo(() =>
    teams
      .map((team) => {
        const members = employees.filter((e) => e.team_id === team.id)
        const pts = scores
          .filter((s) => members.some((m) => m.id === s.user_id))
          .reduce((sum, s) => sum + (s.points_earned || 0), 0)
        return { ...team, pts, memberCount: members.length }
      })
      .sort((a, b) => b.pts - a.pts),
    [teams, employees, scores]
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-mauve-800">Teams</h1>
        <p className="text-mauve-500 text-sm mt-1">{teams.length} active teams</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 skeleton rounded-2xl" />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏆</p>
          <p className="text-mauve-600 font-medium">No teams yet</p>
          <p className="text-mauve-400 text-sm mt-1">Ask an admin to create teams</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {teamsWithPoints.map((team, idx) => (
            <TeamCard
              key={team.id}
              team={team}
              members={employees.filter((e) => e.team_id === team.id)}
              allScores={scores}
              rank={idx + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
