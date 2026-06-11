import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Target, PiggyBank, Sparkles, Calendar, TrendingUp } from 'lucide-react'

export const Budgets = () => {
  const {
    budgets,
    categories,
    transactions,
    addBudget,
    updateBudget,
    goals,
    addGoal,
    updateGoal
  } = useApp()

  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)

  // Budget form state
  const [budCategory, setBudCategory] = useState('')
  const [budLimit, setBudLimit] = useState('')
  const [budMonth, setBudMonth] = useState(new Date().toISOString().substring(0, 7))

  // Goal form state
  const [goalTitle, setGoalTitle] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalCurrent, setGoalCurrent] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')

  const currentMonthStr = new Date().toISOString().substring(0, 7)

  // Calculate spent per budget category for current month
  const getBudgetSpent = (catId, monthStr) => {
    return transactions
      .filter(t => t.category_id === catId && t.type === 'expense' && t.date.substring(0, 7) === monthStr)
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  }

  const handleAddBudget = async (e) => {
    e.preventDefault()
    if (!budCategory || !budLimit) return

    await addBudget({
      category_id: budCategory,
      limit_amount: parseFloat(budLimit),
      month: budMonth
    })

    setBudCategory('')
    setBudLimit('')
    setShowAddBudget(false)
  }

  const handleAddGoal = async (e) => {
    e.preventDefault()
    if (!goalTitle || !goalTarget) return

    await addGoal({
      title: goalTitle,
      target_amount: parseFloat(goalTarget),
      current_amount: parseFloat(goalCurrent) || 0.00,
      deadline: goalDeadline
    })

    setGoalTitle('')
    setGoalTarget('')
    setGoalCurrent('')
    setGoalDeadline('')
    setShowAddGoal(false)
  }

  const handleAddFundsToGoal = async (goalId, amount) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    const nextAmt = parseFloat(goal.current_amount) + parseFloat(amount)
    await updateGoal(goalId, { current_amount: Math.min(parseFloat(goal.target_amount), nextAmt) })
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in-up">
      {/* SECTION 1: BUDGETS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
              Budgets & Limits
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Configure spending limits per category to manage outflows.
            </p>
          </div>
          <button
            onClick={() => setShowAddBudget(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Set Budget</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.filter(b => b.month === currentMonthStr).length === 0 ? (
            <div className="glass-effect rounded-2xl p-10 text-center md:col-span-2">
              <p className="text-slate-400 text-sm">No budgets configured for this month ({currentMonthStr}).</p>
            </div>
          ) : (
            budgets
              .filter(b => b.month === currentMonthStr)
              .map((b) => {
                const cat = categories.find(c => c.id === b.category_id)
                const spent = getBudgetSpent(b.category_id, b.month)
                const limit = parseFloat(b.limit_amount)
                const pct = Math.min(100, Math.round((spent / limit) * 100))
                const isOver = spent > limit

                return (
                  <div key={b.id} className="bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-dark-border/30 relative overflow-hidden space-y-4">
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base">{cat ? cat.name : 'Unknown Category'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Month: {b.month}</p>
                      </div>
                      <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-full ${
                        isOver
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}>
                        {pct}% spent
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                        <span>Spent: ${spent.toFixed(2)}</span>
                        <span>Limit: ${limit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>

      {/* SECTION 2: SAVINGS GOALS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
              Savings Goals
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Visualize milestones and target budgets for items you want to buy.
            </p>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Create Goal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.length === 0 ? (
            <div className="glass-effect rounded-2xl p-10 text-center md:col-span-2">
              <p className="text-slate-400 text-sm">No savings goals configured. Start planning your future!</p>
            </div>
          ) : (
            goals.map((g) => {
              const target = parseFloat(g.target_amount)
              const current = parseFloat(g.current_amount)
              const pct = Math.min(100, Math.round((current / target) * 100))

              return (
                <div key={g.id} className="bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-dark-border/30 relative overflow-hidden space-y-4">
                  {/* Left Accent Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-1.5">
                        <PiggyBank className="h-5 w-5 text-indigo-500" />
                        {g.title}
                      </h3>
                      {g.deadline && <p className="text-xs text-slate-400 mt-0.5">Deadline: {g.deadline}</p>}
                    </div>
                    <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      {pct}% Saved
                    </span>
                  </div>

                  {/* Goal Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1.5">
                      <span>Saved: ${current.toFixed(2)}</span>
                      <span>Target: ${target.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Add Funds Mini controls */}
                  {pct < 100 && (
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleAddFundsToGoal(g.id, 50)}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 rounded-lg border border-slate-200 dark:border-dark-border transition cursor-pointer"
                      >
                        +$50
                      </button>
                      <button
                        onClick={() => handleAddFundsToGoal(g.id, 100)}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-850 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 rounded-lg border border-slate-200 dark:border-dark-border transition cursor-pointer"
                      >
                        +$100
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal: Set Budget */}
      {showAddBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Configure Category Budget</h3>
              <button onClick={() => setShowAddBudget(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                <select
                  required
                  value={budCategory}
                  onChange={(e) => setBudCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories.filter(c => c.type === 'expense').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Limit Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={budLimit}
                  onChange={(e) => setBudLimit(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Month</label>
                <input
                  type="month"
                  required
                  value={budMonth}
                  onChange={(e) => setBudMonth(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBudget(false)}
                  className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition"
                >
                  Apply Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Goal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Savings Goal</h3>
              <button onClick={() => setShowAddGoal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Goal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dream House Downpayment, Summer Trip"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Target Amount ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Current Savings ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={goalCurrent}
                  onChange={(e) => setGoalCurrent(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Deadline</label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
