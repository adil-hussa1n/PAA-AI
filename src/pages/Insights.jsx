import React from 'react'
import { useApp } from '../context/AppContext'
import { Sparkles, Heart, AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export const Insights = () => {
  const { healthScore, insights } = useApp()

  const getInsightIcon = (type) => {
    switch (type) {
      case 'danger': return <AlertCircle className="h-5 w-5 text-rose-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'success': return <CheckCircle className="h-5 w-5 text-emerald-500" />
      default: return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getInsightClass = (type) => {
    switch (type) {
      case 'danger': return 'border-rose-200/50 bg-rose-500/5 text-slate-800 dark:text-slate-200'
      case 'warning': return 'border-amber-200/50 bg-amber-500/5 text-slate-800 dark:text-slate-200'
      case 'success': return 'border-emerald-200/50 bg-emerald-500/5 text-slate-800 dark:text-slate-200'
      default: return 'border-blue-200/50 bg-blue-500/5 text-slate-800 dark:text-slate-200'
    }
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
          Smart Insights
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Auto-generated suggestions and financial feedback based on your cashflow rules.
        </p>
      </div>

      {/* Health score segment */}
      <div className="glass-effect rounded-2xl p-6 shadow-sm border border-slate-200/50 dark:border-dark-border/40 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative h-36 w-36 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${
                  healthScore >= 80 ? 'text-emerald-500' :
                  healthScore >= 50 ? 'text-amber-500' :
                  'text-rose-500'
                }`}
                strokeDasharray={`${healthScore}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="text-5xl font-extrabold">{healthScore}</span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <h3 className="font-extrabold text-xl flex items-center gap-2">
            <Heart className="h-5.5 w-5.5 text-rose-500 animate-pulse" />
            Financial Standing Breakdown
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Your financial health score measures stability using savings rate (30%), category budget compliance (30%), overdue bills (20%), and savings goals milestones progress (20%).
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Savings (Max 30)</span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Budgets (Max 30)</span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Bills (Max 20)</span>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Goals (Max 20)</span>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" /> Suggestions & Insights
        </h3>
        
        <div className="space-y-3.5">
          {insights.length === 0 ? (
            <div className="glass-effect rounded-2xl p-10 text-center">
              <p className="text-slate-400 text-sm">No insights available. Log more transactions, budgets, or bills to generate feedback.</p>
            </div>
          ) : (
            insights.map((ins, i) => (
              <div
                key={i}
                className={`p-4 border rounded-xl flex items-start gap-3.5 transition duration-150 ${getInsightClass(ins.type)}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getInsightIcon(ins.type)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold leading-relaxed">{ins.message}</p>
                  <span className="text-4xs uppercase tracking-wider font-extrabold text-slate-400">
                    Category: {ins.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
