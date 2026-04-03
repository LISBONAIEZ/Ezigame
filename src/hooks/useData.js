import { useState, useEffect, useCallback } from 'react'
import { supabase, getCurrentMonth } from '../lib/supabase'

export function useEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*, teams(id, name)')
      .order('full_name')
    if (error) setError(error.message)
    else setEmployees(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { employees, loading, error, refetch: fetch }
}

export function useTeams() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('teams').select('*').order('name')
    setTeams(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { teams, loading, refetch: fetch }
}

export function useMonthlyScores(month = null) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const targetMonth = month || getCurrentMonth()

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('monthly_scores')
      .select('*, point_categories(id, name, points_value), profiles(id, full_name, photo_url, team_id, teams(id, name))')
      .eq('month', targetMonth)
    setScores(data || [])
    setLoading(false)
  }, [targetMonth])

  useEffect(() => { fetch() }, [fetch])

  return { scores, loading, refetch: fetch }
}

export function usePointCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('point_categories').select('*').then(({ data }) => {
      setCategories(data || [])
      setLoading(false)
    })
  }, [])

  return { categories, loading }
}

export function useAvailableMonths() {
  const [months, setMonths] = useState([])

  useEffect(() => {
    supabase
      .from('monthly_scores')
      .select('month')
      .order('month', { ascending: false })
      .then(({ data }) => {
        const unique = [...new Set((data || []).map((d) => d.month))]
        setMonths(unique)
      })
  }, [])

  return months
}
