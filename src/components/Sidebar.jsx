import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  Users,
  PieChart,
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  CreditCard,
  Target,
  LogOut,
  Settings,
  User
} from 'lucide-react'

export const Sidebar = () => {
  const { activeTab, setActiveTab, theme, toggleTheme, user, logOut, showToast } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Profile Settings Form State
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
  const [newPassword, setNewPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', name: 'Transactions', icon: ArrowLeftRight },
    { id: 'accounts', name: 'Accounts', icon: Wallet },
    { id: 'categories', name: 'Categories', icon: Tag },
    { id: 'parties', name: 'Parties & Debt', icon: Users },
    { id: 'budgets', name: 'Budgets & Goals', icon: Target },
    { id: 'bills', name: 'Bills & Dues', icon: CreditCard },
    { id: 'calendar', name: 'Calendar View', icon: Calendar },
    { id: 'insights', name: 'Smart Insights', icon: Sparkles }
  ]

  const toggleMobileMenu = () => setIsOpen(!isOpen)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      if (isSupabaseConfigured()) {
        const updates = {}
        if (displayName) updates.data = { display_name: displayName }
        if (newPassword) updates.password = newPassword

        const { error } = await supabase.auth.updateUser(updates)
        if (error) throw error
        showToast('Profile updated in Supabase successfully!')
      } else {
        // Local mockup updates
        const localUser = JSON.parse(localStorage.getItem('paa_user') || '{}')
        if (localUser.user) {
          localUser.user.user_metadata = { ...localUser.user.user_metadata, display_name: displayName }
          localStorage.setItem('paa_user', JSON.stringify(localUser))
        }
        showToast('Profile updated locally!')
      }
      setNewPassword('')
      setShowSettings(false)
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-dark-border bg-white/70 dark:bg-dark-card/70 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-indigo-600/30">
            C
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Centava
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 transition duration-200 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition duration-200 cursor-pointer"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between transition-transform duration-300 md:translate-x-0 md:sticky md:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header Branding */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200 dark:border-dark-border">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-600/30 animate-pulse">
                C
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Centava
              </span>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 py-6 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition duration-200 group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 duration-200 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    }`}
                  />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Footer controls & Profile */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-border space-y-2">
          {/* Desktop Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition duration-200 cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-5 w-5 text-indigo-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 text-indigo-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          {/* User Profile Info Card */}
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-dark-border/40 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shadow-sm">
                {displayName ? displayName[0].toUpperCase() : (user ? user.email[0].toUpperCase() : 'U')}
              </div>
              <div className="overflow-hidden flex-grow min-w-0">
                <p className="text-xs font-extrabold truncate">{displayName || 'Personal User'}</p>
                <p className="text-3xs text-slate-400 dark:text-slate-500 truncate">{user ? user.email : 'No email session'}</p>
              </div>
            </div>
            
            {/* Quick Profile Settings & Log Out Actions */}
            <div className="flex gap-1.5 pt-1.5 border-t border-slate-200/50 dark:border-dark-border/50">
              <button
                onClick={() => setShowSettings(true)}
                title="Edit Profile"
                className="w-1/2 py-2 flex items-center justify-center gap-1 bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-2xs font-semibold border border-slate-200 dark:border-dark-border transition cursor-pointer text-slate-600 dark:text-slate-300"
              >
                <Settings className="h-3.5 w-3.5" />
                Profile
              </button>
              <button
                onClick={logOut}
                title="Sign Out"
                className="w-1/2 py-2 flex items-center justify-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg text-2xs font-semibold text-rose-600 dark:text-rose-400 transition cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Edit Profile / Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" />
                Profile Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Adil Hossain"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Change Password</label>
                <input
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
