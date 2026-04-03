import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase, getCurrentMonth, POINT_CATEGORIES, formatMonth } from '../lib/supabase'
import { useEmployees, useTeams, useMonthlyScores, usePointCategories } from '../hooks/useData'

const TABS = ['employees', 'teams', 'scores', 'users']

export default function Admin() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('employees')
  const { employees, refetch: refetchEmployees } = useEmployees()
  const { teams, refetch: refetchTeams } = useTeams()
  const { scores, refetch: refetchScores } = useMonthlyScores()
  const { categories } = usePointCategories()

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-mauve-800">Admin Panel</h1>
        <p className="text-mauve-500 text-sm mt-1">Manage employees, teams, and monthly scores</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-white border border-beige-200 rounded-2xl p-1 w-fit">
        {[
          { id: 'employees', label: '👥 Employees' },
          { id: 'teams', label: '🏆 Teams' },
          { id: 'scores', label: '⭐ Scores' },
          { id: 'users', label: '🔑 Roles' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activeTab === tab.id ? 'bg-pink-50 text-pink-500 shadow-sm' : 'text-mauve-500 hover:text-mauve-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'employees' && (
        <EmployeesTab employees={employees} teams={teams} refetch={refetchEmployees} adminId={profile?.id} />
      )}
      {activeTab === 'teams' && (
        <TeamsTab teams={teams} refetch={refetchTeams} />
      )}
      {activeTab === 'scores' && (
        <ScoresTab employees={employees} categories={categories} scores={scores} refetch={refetchScores} adminId={profile?.id} />
      )}
      {activeTab === 'users' && (
        <UsersTab employees={employees} />
      )}
    </div>
  )
}

/* ── Employees Tab ── */
function EmployeesTab({ employees, teams, refetch, adminId }) {
  const [form, setForm] = useState({ full_name: '', role: '', bio: '', photo_url: '', team_id: '', joined_at: '' })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const reset = () => { setForm({ full_name: '', role: '', bio: '', photo_url: '', team_id: '', joined_at: '' }); setEditing(null) }

  const handleEdit = (emp) => {
    setEditing(emp.id)
    setForm({
      full_name: emp.full_name || '',
      role: emp.role || '',
      bio: emp.bio || '',
      photo_url: emp.photo_url || '',
      team_id: emp.team_id || '',
      joined_at: emp.joined_at ? emp.joined_at.slice(0, 10) : '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    const payload = { ...form, team_id: form.team_id || null, joined_at: form.joined_at || null }
    let error
    if (editing) {
      const res = await supabase.from('profiles').update(payload).eq('id', editing)
      error = res.error
    } else {
      setMsg('Cannot create employees directly — users sign up then admin assigns info.')
      setSaving(false)
      return
    }
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Saved!'); reset(); refetch() }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee profile?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) refetch()
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* List */}
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold text-mauve-800">All Employees ({employees.length})</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-beige-200">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0">
                {emp.photo_url ? (
                  <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-pink-400 font-bold">
                    {emp.full_name?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-mauve-800 truncate">{emp.full_name}</p>
                <p className="text-xs text-mauve-400">{emp.role || 'No role'} · {emp.teams?.name || 'No team'}</p>
              </div>
              <button
                onClick={() => handleEdit(emp)}
                className="px-3 py-1.5 text-xs text-pink-500 border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(emp.id)}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
              >
                Del
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-beige-200 p-5">
        <h2 className="font-semibold text-mauve-800 mb-4">{editing ? 'Edit Employee' : 'Employee Info'}</h2>
        <div className="space-y-3">
          {[
            { label: 'Full Name', key: 'full_name', type: 'text' },
            { label: 'Job Role', key: 'role', type: 'text' },
            { label: 'Photo URL', key: 'photo_url', type: 'url' },
            { label: 'Start Date', key: 'joined_at', type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-mauve-600 mb-1">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800
                  focus:border-pink-300 focus:bg-white transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-mauve-600 mb-1">Team</label>
            <select
              value={form.team_id}
              onChange={(e) => setForm((f) => ({ ...f, team_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800 focus:border-pink-300 transition-all"
            >
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-mauve-600 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800 resize-none
                focus:border-pink-300 focus:bg-white transition-all"
            />
          </div>

          {msg && (
            <p className={`text-xs ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>
          )}

          <div className="flex gap-2">
            {editing && (
              <button onClick={reset} className="flex-1 py-2 rounded-xl border border-beige-200 text-sm text-mauve-600 hover:bg-beige-50 transition-colors">
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !editing}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-medium
                hover:from-pink-500 hover:to-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {!editing && <p className="text-xs text-mauve-400 text-center">Select an employee above to edit</p>}
        </div>
      </div>
    </div>
  )
}

/* ── Teams Tab ── */
function TeamsTab({ teams, refetch }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const reset = () => { setForm({ name: '', description: '' }); setEditing(null) }

  const handleSave = async () => {
    if (!form.name.trim()) { setMsg('Name is required'); return }
    setSaving(true)
    setMsg('')
    let error
    if (editing) {
      const res = await supabase.from('teams').update(form).eq('id', editing)
      error = res.error
    } else {
      const res = await supabase.from('teams').insert(form)
      error = res.error
    }
    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Saved!'); reset(); refetch() }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team?')) return
    const { error } = await supabase.from('teams').delete().eq('id', id)
    if (!error) refetch()
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold text-mauve-800">All Teams ({teams.length})</h2>
        <div className="space-y-2">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-beige-200">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-xl flex-shrink-0">🏆</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-mauve-800">{team.name}</p>
                <p className="text-xs text-mauve-400 truncate">{team.description || 'No description'}</p>
              </div>
              <button onClick={() => { setEditing(team.id); setForm({ name: team.name, description: team.description || '' }) }}
                className="px-3 py-1.5 text-xs text-pink-500 border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors">
                Edit
              </button>
              <button onClick={() => handleDelete(team.id)}
                className="px-3 py-1.5 text-xs text-red-400 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                Del
              </button>
            </div>
          ))}
          {teams.length === 0 && <p className="text-mauve-400 text-sm text-center py-8">No teams yet. Create one!</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-beige-200 p-5">
        <h2 className="font-semibold text-mauve-800 mb-4">{editing ? 'Edit Team' : 'New Team'}</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-mauve-600 mb-1">Team Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Marketing"
              className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800 focus:border-pink-300 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-mauve-600 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Optional description..."
              className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800 resize-none focus:border-pink-300 focus:bg-white transition-all" />
          </div>
          {msg && <p className={`text-xs ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
          <div className="flex gap-2">
            {editing && <button onClick={reset} className="flex-1 py-2 rounded-xl border border-beige-200 text-sm text-mauve-600 hover:bg-beige-50 transition-colors">Cancel</button>}
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-medium hover:from-pink-500 hover:to-rose-500 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : editing ? 'Update' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Scores Tab ── */
function ScoresTab({ employees, categories, scores, refetch, adminId }) {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [scoreValues, setScoreValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Load existing scores when employee/month changes
  useEffect(() => {
    if (!selectedEmployee || !selectedMonth) return
    const existing = {}
    scores
      .filter((s) => s.user_id === selectedEmployee)
      .forEach((s) => {
        existing[s.category_id] = s.points_earned
      })
    setScoreValues(existing)
  }, [selectedEmployee, selectedMonth, scores])

  const handleSave = async () => {
    if (!selectedEmployee) { setMsg('Select an employee'); return }
    setSaving(true)
    setMsg('')

    const upserts = categories.map((cat) => ({
      user_id: selectedEmployee,
      category_id: cat.id,
      month: selectedMonth,
      points_earned: Number(scoreValues[cat.id] || 0),
      created_by: adminId,
    }))

    const { error } = await supabase
      .from('monthly_scores')
      .upsert(upserts, { onConflict: 'user_id,category_id,month' })

    if (error) setMsg(`Error: ${error.message}`)
    else { setMsg('Scores saved!'); refetch() }
    setSaving(false)
  }

  // Generate month options (current + past 11 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })

  const totalSelected = Object.values(scoreValues).reduce((sum, v) => sum + (Number(v) || 0), 0)

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-beige-200 p-5 space-y-4">
        <h2 className="font-semibold text-mauve-800">Input Scores</h2>

        <div>
          <label className="block text-xs font-medium text-mauve-600 mb-1">Employee</label>
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800 focus:border-pink-300 transition-all">
            <option value="">Select employee...</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-mauve-600 mb-1">Month</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-beige-200 bg-beige-50 text-sm text-mauve-800 focus:border-pink-300 transition-all">
            {monthOptions.map((m) => <option key={m} value={m}>{formatMonth(m)}</option>)}
          </select>
        </div>

        {/* Score inputs */}
        {categories.length > 0 && selectedEmployee && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold text-mauve-600 uppercase tracking-wide">Categories</p>
              <span className="text-sm font-bold text-pink-500">{totalSelected} pts</span>
            </div>
            {categories.map((cat) => {
              const catInfo = POINT_CATEGORIES.find((c) => c.key === cat.name)
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-base flex-shrink-0">{catInfo?.icon || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-mauve-700 truncate">{catInfo?.label || cat.name}</p>
                    <p className="text-xs text-mauve-400">max {cat.points_value} pts</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={cat.points_value}
                    value={scoreValues[cat.id] ?? ''}
                    onChange={(e) => setScoreValues((v) => ({ ...v, [cat.id]: Math.min(cat.points_value, Math.max(0, Number(e.target.value))) }))}
                    className="w-16 px-2 py-1.5 rounded-lg border border-beige-200 text-sm text-center text-mauve-800 bg-beige-50 focus:border-pink-300 transition-all"
                  />
                </div>
              )
            })}
          </div>
        )}

        {msg && <p className={`text-xs ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}

        <button onClick={handleSave} disabled={saving || !selectedEmployee}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white text-sm font-medium
            hover:from-pink-500 hover:to-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? 'Saving...' : 'Save Scores'}
        </button>
      </div>

      {/* Score overview */}
      <div className="lg:col-span-2 space-y-3">
        <h2 className="font-semibold text-mauve-800">Current Month Scores</h2>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {employees.map((emp) => {
            const empScores = scores.filter((s) => s.user_id === emp.id)
            const total = empScores.reduce((sum, s) => sum + (s.points_earned || 0), 0)
            return (
              <div key={emp.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-beige-200 hover:border-pink-200 transition-colors cursor-pointer"
                onClick={() => setSelectedEmployee(emp.id)}>
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-pink-50 flex-shrink-0">
                  {emp.photo_url ? <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-pink-400 font-bold text-sm">{emp.full_name?.[0]?.toUpperCase()}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-mauve-800">{emp.full_name}</p>
                  <div className="h-1.5 bg-beige-100 rounded-full mt-1">
                    <div className="h-full bg-gradient-to-r from-pink-300 to-rose-400 rounded-full"
                      style={{ width: `${Math.min(100, (total / 75) * 100)}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-mauve-800 flex-shrink-0">{total} pts</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Users / Roles Tab ── */
function UsersTab({ employees }) {
  const [roles, setRoles] = useState({})
  const [saving, setSaving] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('user_roles').select('*').then(({ data }) => {
      const map = {}
      ;(data || []).forEach((r) => { map[r.user_id] = r.role })
      setRoles(map)
    })
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setSaving(userId)
    setMsg('')
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' })
    if (error) setMsg(`Error: ${error.message}`)
    else {
      setRoles((r) => ({ ...r, [userId]: newRole }))
      setMsg(`Role updated to ${newRole}`)
    }
    setSaving(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-mauve-800">User Roles</h2>
      {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {employees.map((emp) => (
          <div key={emp.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-beige-200">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-pink-50 flex-shrink-0">
              {emp.photo_url ? <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-pink-400 font-bold">{emp.full_name?.[0]?.toUpperCase()}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mauve-800 truncate">{emp.full_name}</p>
            </div>
            <select
              value={roles[emp.id] || 'employee'}
              onChange={(e) => handleRoleChange(emp.id, e.target.value)}
              disabled={saving === emp.id}
              className={`px-2 py-1.5 rounded-lg text-xs border transition-all
                ${roles[emp.id] === 'admin' ? 'border-pink-300 text-pink-600 bg-pink-50' : 'border-beige-200 text-mauve-600 bg-beige-50'}
                focus:border-pink-300 disabled:opacity-50`}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
