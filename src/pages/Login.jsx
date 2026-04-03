import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/')
    } else {
      if (!fullName.trim()) { setError('Full name is required'); setLoading(false); return }
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error.message)
      else setSuccess('Account created! Please check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-beige-100 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-pink-100 rounded-full opacity-60 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-rose-100 rounded-full opacity-50 blur-3xl" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-beige-200 rounded-full opacity-40 blur-2xl" />

      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative">
        <div className="max-w-md animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-300 to-rose-500 flex items-center justify-center shadow-lg mb-8">
            <span className="text-white text-3xl font-bold">E</span>
          </div>
          <h1 className="text-5xl font-bold text-mauve-800 leading-tight mb-4">
            Achieve More,<br />
            <span className="gradient-text">Together.</span>
          </h1>
          <p className="text-mauve-600 text-lg leading-relaxed mb-10">
            Track performance, celebrate achievements, and grow as a team with EziGame — your company's gamification platform.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Team Members', value: '50+', icon: '👥' },
              { label: 'Points Earned', value: '12k', icon: '⭐' },
              { label: 'Teams', value: '8', icon: '🏆' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold text-mauve-800">{stat.value}</div>
                <div className="text-xs text-mauve-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-beige-200 p-8">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center">
                <span className="text-white text-xl font-bold">E</span>
              </div>
              <span className="font-bold text-xl text-mauve-800">EziGame</span>
            </div>

            <h2 className="text-2xl font-bold text-mauve-800 mb-1">
              {mode === 'login' ? 'Welcome back!' : 'Create account'}
            </h2>
            <p className="text-mauve-500 text-sm mb-8">
              {mode === 'login'
                ? 'Sign in to access your dashboard.'
                : 'Join EziGame and start earning points.'}
            </p>

            {/* Mode toggle */}
            <div className="flex bg-beige-100 rounded-2xl p-1 mb-6">
              {['login', 'signup'].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200
                    ${mode === m ? 'bg-white text-mauve-800 shadow-sm' : 'text-mauve-500 hover:text-mauve-700'}`}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-mauve-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-beige-200 bg-beige-50 text-mauve-800 text-sm
                      placeholder:text-mauve-400 focus:border-pink-300 focus:bg-white transition-all duration-200"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-mauve-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-beige-200 bg-beige-50 text-mauve-800 text-sm
                    placeholder:text-mauve-400 focus:border-pink-300 focus:bg-white transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-mauve-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-beige-200 bg-beige-50 text-mauve-800 text-sm
                    placeholder:text-mauve-400 focus:border-pink-300 focus:bg-white transition-all duration-200"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                  <span>⚠️</span> {error}
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
                  <span>✅</span> {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-semibold text-sm
                  hover:from-pink-500 hover:to-rose-500 transition-all duration-200 shadow-md hover:shadow-lg
                  disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  mode === 'login' ? 'Sign In →' : 'Create Account →'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
