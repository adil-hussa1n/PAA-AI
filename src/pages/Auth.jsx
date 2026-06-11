import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { dbService } from '../services/dbService'
import { isSupabaseConfigured } from '../services/supabaseClient'
import { Lock, Mail, UserPlus, LogIn, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'

export const Auth = () => {
  const { showToast } = useApp()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerificationAlert, setShowVerificationAlert] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [inlineError, setInlineError] = useState('')

  useEffect(() => {
    let interval
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

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
        
        // If Supabase email confirmation is disabled, it returns session immediately
        if (data && data.session) {
          showToast('Sign up successful! Logging you in...', 'success')
          // Reload page to re-fetch sessions
          window.location.reload()
        } else {
          showToast('Sign up successful! Verification link sent.')
          setShowVerificationAlert(true)
        }
      } else {
        const { data, error } = await dbService.signIn(email, password)
        if (error) {
          // Check for email confirmation error
          const msg = error.message.toLowerCase()
          if (msg.includes('confirm') || msg.includes('verify') || msg.includes('email_not_confirmed')) {
            showToast('Email not confirmed yet.', 'warning')
            setInlineError('Your email address has not been verified yet. Please check your inbox or request a new verification link below.')
            setShowVerificationAlert(true)
            setLoading(false)
            return
          }
          throw error
        }
        showToast('Successfully signed in!')
        // Reload page to re-fetch sessions
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
      const errorMsg = err.message || 'Authentication failed.'
      // Customize message for typical wrong password / credential errors
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

  const handleResendVerification = async () => {
    if (resendTimer > 0) return
    setInlineError('')
    try {
      const { error } = await dbService.resendVerification(email)
      if (error) throw error
      showToast('Verification email resent successfully!')
      setResendTimer(60)
    } catch (err) {
      setInlineError(err.message || 'Failed to resend verification link.')
      showToast(err.message || 'Failed to resend verification link.', 'error')
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 p-4">
      {/* Auth Card */}
      <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-xl overflow-hidden animate-scale-in">
        {/* Card Header Gradient */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white text-center relative">
          <div className="absolute top-4 right-4 animate-pulse">
            <Sparkles className="h-5 w-5 opacity-70" />
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-lg">
            C
          </div>
          <h2 className="text-2xl font-extrabold mt-4 tracking-tight">
            {showVerificationAlert ? 'Email Verification' : isSignUp ? 'Create your Account' : 'Welcome to Centava'}
          </h2>
          <p className="text-indigo-100 text-xs mt-1.5 font-medium">
            {showVerificationAlert ? 'Confirm your email to complete registration' : isSignUp ? 'Start tracking your financial freedom' : 'Sign in to access your ledger'}
          </p>
        </div>

        {/* Card Form Body */}
        {showVerificationAlert ? (
          <div className="p-8 space-y-6 text-center animate-scale-in">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Mail className="h-8 w-8 animate-pulse text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Verify your Email</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                We've sent a verification link to <strong className="text-slate-800 dark:text-slate-200">{email}</strong>. Please check your inbox and click the link to confirm your account.
              </p>
            </div>

            {inlineError && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-600 dark:text-rose-400 text-xs text-left animate-scale-in">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">{inlineError}</p>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendTimer > 0}
                className="w-full py-3 border border-slate-200 dark:border-dark-border bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/85 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${resendTimer > 0 ? 'animate-spin' : ''}`} />
                {resendTimer > 0 ? `Resend Link (${resendTimer}s)` : 'Resend Verification Link'}
              </button>

              {!isSupabaseConfigured() && (
                <button
                  onClick={async () => {
                    await dbService.simulateOfflineVerification(email)
                    showToast('Mock email verification completed!', 'success')
                    window.location.reload()
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md transition cursor-pointer text-sm"
                >
                  Simulate Verification Link Click (Dev Mode)
                </button>
              )}

              <button
                onClick={() => {
                  setShowVerificationAlert(false)
                  setIsSignUp(false)
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition cursor-pointer text-sm"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}
