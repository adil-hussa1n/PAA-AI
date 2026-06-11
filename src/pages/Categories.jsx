import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Tag, Plus, Check, HelpCircle } from 'lucide-react'

const AVAILABLE_ICONS = ['Tag', 'Briefcase', 'Laptop', 'Utensils', 'Home', 'Film', 'Zap', 'Car', 'ShoppingBag', 'Heart', 'Gift', 'Plane']
const PRESET_COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16']

export const Categories = () => {
  const { categories, addCategory, transactions } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0])

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    await addCategory({
      name: name.trim(),
      type,
      color: selectedColor,
      icon: selectedIcon
    })

    setName('')
    setType('expense')
    setSelectedColor(PRESET_COLORS[0])
    setSelectedIcon(AVAILABLE_ICONS[0])
    setShowAddModal(false)
  }

  // Calculate stats per category
  const getCategoryStats = (catId) => {
    const catTxs = transactions.filter(t => t.category_id === catId)
    const count = catTxs.length
    const total = catTxs.reduce((sum, t) => sum + parseFloat(t.amount), 0)
    return { count, total }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Categories
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Group your cashflow by tags and monitor distribution patterns.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const stats = getCategoryStats(cat.id)
          return (
            <div
              key={cat.id}
              className="glass-effect rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/40 flex items-start gap-4"
            >
              {/* Color Block Icon */}
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md"
                style={{ backgroundColor: cat.color }}
              >
                <Tag className="h-5 w-5" />
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">
                    {cat.name}
                  </h3>
                  <span className={`text-3xs uppercase font-extrabold px-2 py-0.5 rounded-full ${
                    cat.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}>
                    {cat.type}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-lg font-extrabold">${stats.total.toFixed(2)}</span>
                  <span className="text-xs text-slate-400">Total Spent/Received</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{stats.count} transactions logged</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Add Category */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Create Custom Tag / Category</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Health, Subscriptions, Gift"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Flow Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-3 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
                        : 'border-slate-200 dark:border-dark-border'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-3 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-dark-border'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Color Tag</label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className="h-7 w-7 rounded-full flex items-center justify-center border border-white dark:border-slate-900 shadow-sm relative cursor-pointer"
                      style={{ backgroundColor: col }}
                    >
                      {selectedColor === col && <Check className="h-4.5 w-4.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition"
                >
                  Create Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
