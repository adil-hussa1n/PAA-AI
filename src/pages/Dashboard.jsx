import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  TrendingUp as CashFlowIcon,
  Heart,
  AlertCircle,
  Wallet,
  PieChart
} from 'lucide-react'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export const Dashboard = ({ onAddTransactionClick }) => {
  const {
    accounts,
    transactions,
    categories,
    healthScore,
    insights,
    setActiveTab
  } = useApp()

  // Calculate Balances
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  // Chart 1: Expenses by Category (Doughnut)
  const expenseTransactions = transactions.filter(t => t.type === 'expense')
  const expenseByCategory = {}
  expenseTransactions.forEach(tx => {
    const cat = categories.find(c => c.id === tx.category_id)
    const catName = cat ? cat.name : 'Uncategorized'
    expenseByCategory[catName] = (expenseByCategory[catName] || 0) + parseFloat(tx.amount)
  })

  const categoryLabels = Object.keys(expenseByCategory)
  const categoryData = Object.values(expenseByCategory)
  const categoryColors = categoryLabels.map(label => {
    const cat = categories.find(c => c.name === label)
    return cat ? cat.color : '#cbd5e1'
  })

  const doughnutData = {
    labels: categoryLabels.length > 0 ? categoryLabels : ['No Expenses'],
    datasets: [
      {
        data: categoryData.length > 0 ? categoryData : [1],
        backgroundColor: categoryColors.length > 0 ? categoryColors : ['#e2e8f0'],
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  }

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 12 },
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            if (categoryLabels.length === 0) return 'No expenses logged'
            return ` $${context.raw.toFixed(2)}`
          }
        }
      }
    },
    cutout: '70%'
  }

  // Chart 2: Monthly Income vs Expenses (Bar Chart)
  // Let's group last 6 months or 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyIncome = last7Days.map(date => {
    return transactions
      .filter(t => t.date === date && t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  })

  const dailyExpense = last7Days.map(date => {
    return transactions
      .filter(t => t.date === date && t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  })

  const barData = {
    labels: last7Days.map(d => {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Income',
        data: dailyIncome,
        backgroundColor: '#10b981',
        borderRadius: 6
      },
      {
        label: 'Expense',
        data: dailyExpense,
        backgroundColor: '#ef4444',
        borderRadius: 6
      }
    ]
  }

  const barOptions = {
    responsive: true,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#94a3b8', font: { family: 'Outfit' } }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Outfit' }
        }
      }
    }
  }

  // Chart 3: Balance Trend / Cash Flow (Line)
  // Compute running balance for last 7 days
  let tempBalance = totalBalance
  const runningBalances = []
  
  // Start from today and subtract net daily changes backwards
  const dailyNetChanges = last7Days.map(date => {
    const inc = transactions.filter(t => t.date === date && t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const exp = transactions.filter(t => t.date === date && t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    return inc - exp
  })

  // Reconstruct balances
  const balances = []
  let currentBal = totalBalance
  for (let i = dailyNetChanges.length - 1; i >= 0; i--) {
    balances.unshift(currentBal)
    currentBal -= dailyNetChanges[i]
  }

  const lineData = {
    labels: last7Days.map(d => {
      const date = new Date(d)
      return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
    }),
    datasets: [
      {
        label: 'Net Balance',
        data: balances,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1'
      }
    ]
  }

  const lineOptions = {
    responsive: true,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Outfit' } } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit' } } }
    },
    plugins: {
      legend: { display: false }
    }
  }

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  const activeInsights = insights.slice(0, 2)

  return (
    <div className="p-6 space-y-8 animate-fade-in-up">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-slate-900 dark:text-white m-0">
            Financial Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5">
            Welcome back! Here is a summary of your financial status.
          </p>
        </div>
        <button
          onClick={onAddTransactionClick}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-3 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Add Transaction
        </button>
      </div>

      {/* Main KPI metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Balance Card */}
        <div className="glass-effect rounded-2xl p-6 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-indigo-500 group-hover:scale-110 transition duration-300">
            <Wallet className="h-16 w-16" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Net Available Balance
          </p>
          <p className="text-4xl font-extrabold mt-3 tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              {accounts.length} active wallets
            </span>
          </div>
        </div>

        {/* Total Income Card */}
        <div className="glass-effect rounded-2xl p-6 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-emerald-500 group-hover:scale-110 transition duration-300">
            <TrendingUp className="h-16 w-16" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Inflow
          </p>
          <p className="text-4xl font-extrabold mt-3 text-emerald-600 dark:text-emerald-400 tracking-tight">
            ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span>Sum of all income transactions</span>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="glass-effect rounded-2xl p-6 shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-rose-500 group-hover:scale-110 transition duration-300">
            <TrendingDown className="h-16 w-16" />
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Outflow
          </p>
          <p className="text-4xl font-extrabold mt-3 text-rose-600 dark:text-rose-400 tracking-tight">
            ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingDown className="h-4 w-4 text-rose-500" />
            <span>Sum of all expense transactions</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Line Chart */}
        <div className="glass-effect rounded-2xl p-5 shadow-md lg:col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <CashFlowIcon className="h-5 w-5 text-indigo-500" />
            Net Balance Cash Flow (Last 7 Days)
          </h3>
          <div className="h-64">
            <Line data={lineData} options={lineOptions} />
          </div>
        </div>

        {/* Expense Category Breakout Chart */}
        <div className="glass-effect rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Expense Breakdown
            </h3>
            <div className="h-56 flex items-center justify-center relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Expenses</span>
                <span className="text-lg font-extrabold text-slate-700 dark:text-slate-200">${totalExpense.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights and Recents Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="glass-effect rounded-2xl p-5 shadow-md lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition duration-150 cursor-pointer"
            >
              See all <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3">Note</th>
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-sm">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400">
                      No transactions found. Click Add Transaction to start tracking!
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => {
                    const acc = accounts.find((a) => a.id === tx.account_id)
                    const cat = categories.find((c) => c.id === tx.category_id)
                    const isIncome = tx.type === 'income'
                    const isTransfer = tx.type === 'transfer'

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition duration-150">
                        <td className="py-3.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{tx.note || 'No description'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-3.5 text-slate-500 dark:text-slate-400">{acc ? acc.name : 'Unknown'}</td>
                        <td className="py-3.5">
                          {isTransfer ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                              Transfer
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor: `${cat ? cat.color : '#6366f1'}15`,
                                color: cat ? cat.color : '#6366f1'
                              }}
                            >
                              {cat ? cat.name : 'Uncategorized'}
                            </span>
                          )}
                        </td>
                        <td className={`py-3.5 text-right font-bold ${
                          isIncome ? 'text-emerald-500' :
                          isTransfer ? 'text-slate-500' :
                          'text-rose-500'
                        }`}>
                          {isIncome ? '+' : isTransfer ? '' : '-'}${parseFloat(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mini Health Score Card */}
        <div className="glass-effect rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 animate-pulse" />
                Financial Health
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                Score
              </span>
            </div>

            {/* Health Meter Radial */}
            <div className="flex flex-col items-center justify-center py-3">
              <div className="relative h-28 w-28 flex items-center justify-center">
                {/* Circular Gradient / Border */}
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
                <span className="text-3xl font-extrabold">{healthScore}</span>
              </div>
              <p className="text-sm font-bold mt-4 text-center">
                {healthScore >= 80 ? 'Excellent Standing 🎉' :
                 healthScore >= 50 ? 'Stable Finances 👍' :
                 'Needs Attention ⚠️'}
              </p>
            </div>

            {/* Smart Insights summary */}
            <div className="mt-4 space-y-2.5">
              {activeInsights.length === 0 ? (
                <p className="text-xs text-slate-400 text-center">No recommendations yet. Start logging details.</p>
              ) : (
                activeInsights.map((ins, i) => (
                  <div key={i} className="flex gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                      ins.type === 'danger' ? 'text-rose-500' :
                      ins.type === 'warning' ? 'text-amber-500' :
                      'text-indigo-500'
                    }`} />
                    <span className="text-slate-600 dark:text-slate-300 leading-normal">{ins.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('insights')}
            className="w-full mt-4 text-center py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition duration-150 cursor-pointer"
          >
            Open All Insights
          </button>
        </div>
      </div>
    </div>
  )
}
