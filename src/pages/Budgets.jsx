import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Target, PiggyBank, Sparkles, Calendar, TrendingUp, RefreshCw, Trash2, ShieldAlert } from 'lucide-react'

export const Budgets = () => {
  const {
    budgets,
    categories,
    transactions,
    addBudget,
    updateBudget,
    goals,
    addGoal,
    updateGoal,
    accounts,
    recurringTemplates,
    addRecurringTemplate,
    deleteRecurringTemplate,
    updateRecurringTemplate
  } = useApp()

  const [showAddBudget, setShowAddBudget] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showAddRecTemplate, setShowAddRecTemplate] = useState(false)

  // Recurring form state
  const [recTitle, setRecTitle] = useState('')
  const [recAmount, setRecAmount] = useState('')
  const [recAccountId, setRecAccountId] = useState('')
  const [recType, setRecType] = useState('expense')
  const [recCategoryId, setRecCategoryId] = useState('')
  const [recFrequency, setRecFrequency] = useState('monthly')
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0])

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

  const handleAddRecTemplate = async (e) => {
    e.preventDefault()
    if (!recTitle || !recAmount || !recAccountId) return

    await addRecurringTemplate({
      title: recTitle,
      amount: parseFloat(recAmount),
      account_id: recAccountId,
      type: recType,
      category_id: recCategoryId || null,
      frequency: recFrequency,
      start_date: recStartDate,
      next_run_date: recStartDate,
      active: true
    })

    setRecTitle('')
    setRecAmount('')
    setRecAccountId('')
    setRecType('expense')
    setRecCategoryId('')
    setRecFrequency('monthly')
    setRecStartDate(new Date().toISOString().split('T')[0])
    setShowAddRecTemplate(false)
  }

  const toggleRecTemplateActive = async (id, currentActive) => {
    await updateRecurringTemplate(id, { active: !currentActive })
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
                  <div key={b.id} className="bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-dark-border/30 relative overflow-hidden space-y-4 premium-card-glow">
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isOver ? 'bg-gradient-to-b from-rose-500 to-red-600' : 'bg-gradient-to-b from-indigo-500 to-purple-600'}`} />
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
                          className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                            isOver ? 'from-rose-500 to-red-600 shadow-lg shadow-rose-500/20' : pct > 80 ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20'
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
                <div key={g.id} className="bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-dark-border/30 relative overflow-hidden space-y-4 premium-card-glow">
                  {/* Left Accent Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-indigo-600" />
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
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-650 shadow-md shadow-indigo-500/20 transition-all duration-500"
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

      {/* SECTION 3: RECURRING TRANSACTIONS & SUBSCRIPTIONS */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
              Recurring & Subscriptions
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Automate monthly utilities, salary schedules, and repeat expenses.
            </p>
          </div>
          <button
            onClick={() => setShowAddRecTemplate(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Add Schedule</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recurringTemplates && recurringTemplates.length === 0 ? (
            <div className="glass-effect rounded-2xl p-10 text-center md:col-span-2">
              <p className="text-slate-400 text-sm">No recurring schedules configured yet.</p>
            </div>
          ) : (
            recurringTemplates && recurringTemplates.map((t) => {
              const acc = accounts.find(a => a.id === t.account_id)
              const cat = categories.find(c => c.id === t.category_id)
              return (
                <div key={t.id} className="bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-dark-border/30 relative overflow-hidden space-y-3">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${t.active ? 'bg-indigo-500' : 'bg-slate-450'}`} />
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <RefreshCw className={`h-4.5 w-4.5 text-indigo-500 ${t.active ? 'animate-spin-slow' : ''}`} />
                        {t.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">
                        {t.frequency} • {t.type} • {cat ? cat.name : 'Uncategorized'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-extrabold text-base ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
                      </p>
                      <span className="text-3xs text-slate-400">Wallet: {acc ? acc.name : 'Unknown'}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-dark-border/40 text-xs">
                    <span className="text-slate-400">Next execution: {t.next_run_date || 'N/A'}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRecTemplateActive(t.id, t.active)}
                        className={`text-2xs font-extrabold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          t.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => deleteRecurringTemplate(t.id)}
                        className="text-slate-450 hover:text-rose-600 transition cursor-pointer"
                        title="Delete Schedule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
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
      {/* Modal: Create Recurring Schedule */}
      {showAddRecTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in max-h-[95vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold">Add Recurring Schedule</h3>
              <button onClick={() => setShowAddRecTemplate(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddRecTemplate} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Title / Payee Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix Subscription, Monthly rent, Salary"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Amount ($)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={recAmount}
                    onChange={(e) => setRecAmount(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Type</label>
                  <select
                    value={recType}
                    onChange={(e) => setRecType(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Wallet / Account</label>
                <select
                  required
                  value={recAccountId}
                  onChange={(e) => setRecAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${parseFloat(acc.balance).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                  <select
                    value={recCategoryId}
                    onChange={(e) => setRecCategoryId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.filter(c => c.type === recType).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Frequency</label>
                  <select
                    value={recFrequency}
                    onChange={(e) => setRecFrequency(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Start Date</label>
                <input
                  type="date"
                  required
                  value={recStartDate}
                  onChange={(e) => setRecStartDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddRecTemplate(false)}
                  className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
