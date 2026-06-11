import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { dbService } from '../services/dbService'
import { Lock, Mail, UserPlus, LogIn, Sparkles, AlertCircle } from 'lucide-react'

export const Auth = () => {
  const { showToast } = useApp()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [inlineError, setInlineError] = useState('')

  // Clear errors when toggling modes
  useEffect(() => {
    setInlineError('')
  }, [isSignUp])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setInlineError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await dbService.signUp(email, password)
        if (error) throw error
        
        if (data && data.session) {
          showToast('Sign up successful! Logging you in...', 'success')
          window.location.reload()
        } else {
          showToast('Sign up successful! If verification is enabled, check your email. Otherwise, you can now sign in.', 'success')
          setIsSignUp(false)
          setPassword('')
        }
      } else {
        const { data, error } = await dbService.signIn(email, password)
        if (error) throw error
        showToast('Successfully signed in!')
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
      const errorMsg = err.message || 'Authentication failed.'
      if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('Invalid email or password')) {
        setInlineError('Incorrect email or password. Please verify your credentials and try again.')
      } else {
        setInlineError(errorMsg)
      }
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 p-4 space-y-6">
      {/* Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-xl overflow-hidden animate-scale-in">
        {/* Card Header Gradient */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 animate-pulse">
            <Sparkles className="h-5 w-5 opacity-70" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-lg mx-auto shadow-lg">
            PAA
          </div>
          <h2 className="text-2xl font-extrabold mt-4 tracking-tight">
            {isSignUp ? 'Create your Account' : 'Welcome to PAA AI'}
          </h2>
          <p className="text-indigo-100 text-xs mt-1.5 font-medium">
            {isSignUp ? 'Start tracking your financial freedom' : 'Sign in to access your ledger'}
          </p>
        </div>

        {/* Card Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {inlineError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 text-xs animate-scale-in">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-left">
                <span className="font-bold block">Authentication Error</span>
                <p className="leading-relaxed">{inlineError}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-2xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-2xs font-semibold text-slate-400 mb-1.5 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10.5 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="h-4.5 w-4.5" />
                <span>Sign Up</span>
              </>
            ) : (
              <>
                <LogIn className="h-4.5 w-4.5" />
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Switch Action Mode link */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>

      {/* Footer Branding for Auth */}
      <div className="text-center space-y-1">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Personal Account Assistant AI
        </p>
        <a
          href="https://www.graffixinnovation.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-bold text-slate-450 hover:text-indigo-500 transition duration-150"
        >
          Smart Finance, Powered by GraffixInnovation
        </a>
      </div>
    </div>
  )
}
