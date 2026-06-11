import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  DollarSign,
  PieChart as PieIcon,
  Activity
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

export const Reports = () => {
  const { transactions, categories, accounts, theme } = useApp()
  const [dateRange, setDateRange] = useState('this-month') // 'today', 'yesterday', '7-days', '30-days', 'this-month', 'last-month', 'this-year', 'custom'
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Determine date boundaries
  const dateBounds = useMemo(() => {
    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (dateRange) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'yesterday':
        start.setDate(now.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(now.getDate() - 1)
        end.setHours(23, 59, 59, 999)
        break
      case '7-days':
        start.setDate(now.getDate() - 6)
        start.setHours(0, 0, 0, 0)
        break
      case '30-days':
        start.setDate(now.getDate() - 29)
        start.setHours(0, 0, 0, 0)
        break
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'this-year':
        start = new Date(now.getFullYear(), 0, 1)
        break
      case 'custom':
        start = customStart ? new Date(customStart) : new Date(0)
        end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date()
        break
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return { start, end }
  }, [dateRange, customStart, customEnd])

  // Filter transactions within selected range
  const rangeTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date)
      return tDate >= dateBounds.start && tDate <= dateBounds.end
    }).sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [transactions, dateBounds])

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let income = 0
    let expenses = 0
    rangeTransactions.forEach(t => {
      const amt = parseFloat(t.amount) || 0
      if (t.type === 'income') income += amt
      if (t.type === 'expense') expenses += amt
    })
    const net = income - expenses
    const savingsRate = income > 0 ? (net / income) * 100 : 0
    return { income, expenses, net, savingsRate }
  }, [rangeTransactions])

  // Data for Inflow vs Outflow over time (Bar Chart)
  const timeChartData = useMemo(() => {
    const groups = {}
    rangeTransactions.forEach(t => {
      const dateKey = t.date // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = { income: 0, expense: 0 }
      }
      if (t.type === 'income') groups[dateKey].income += parseFloat(t.amount)
      if (t.type === 'expense') groups[dateKey].expense += parseFloat(t.amount)
    })

    const labels = Object.keys(groups)
    const incomeData = labels.map(l => groups[l].income)
    const expenseData = labels.map(l => groups[l].expense)

    return {
      labels: labels.map(d => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Inflow (Income)',
          data: incomeData,
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'Outflow (Expense)',
          data: expenseData,
          backgroundColor: '#ef4444',
          borderRadius: 4
        }
      ]
    }
  }, [rangeTransactions])

  // Data for Expense Category Distribution (Doughnut)
  const expenseCatData = useMemo(() => {
    const dict = {}
    rangeTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.category_id)
      const name = cat ? cat.name : 'Uncategorized'
      dict[name] = (dict[name] || 0) + parseFloat(t.amount)
    })

    const labels = Object.keys(dict)
    const data = Object.values(dict)
    const colors = labels.map((l, index) => {
      const cat = categories.find(c => c.name === l)
      if (cat) {
        const isDuplicate = labels.slice(0, index).some(prevLabel => {
          const prevCat = categories.find(c => c.name === prevLabel)
          return prevCat && prevCat.color === cat.color
        })
        if (isDuplicate) {
          return `hsl(${(220 + index * 40) % 360}, 75%, 60%)`
        }
        return cat.color
      }
      return '#cbd5e1'
    })

    return {
      labels: labels.length > 0 ? labels : ['No Outflows'],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: colors.length > 0 ? colors : ['#e2e8f0'],
        borderWidth: data.length > 0 ? 2 : 0,
        borderColor: theme === 'dark' ? '#111827' : '#ffffff',
        spacing: data.length > 0 ? 4 : 0,
        borderRadius: data.length > 0 ? 4 : 0
      }],
      raw: dict
    }
  }, [rangeTransactions, categories, theme])

  // Data for Income Category Distribution (Doughnut)
  const incomeCatData = useMemo(() => {
    const dict = {}
    rangeTransactions.filter(t => t.type === 'income').forEach(t => {
      const cat = categories.find(c => c.id === t.category_id)
      const name = cat ? cat.name : 'Uncategorized'
      dict[name] = (dict[name] || 0) + parseFloat(t.amount)
    })

    const labels = Object.keys(dict)
    const data = Object.values(dict)
    const colors = labels.map((l, index) => {
      const cat = categories.find(c => c.name === l)
      if (cat) {
        const isDuplicate = labels.slice(0, index).some(prevLabel => {
          const prevCat = categories.find(c => c.name === prevLabel)
          return prevCat && prevCat.color === cat.color
        })
        if (isDuplicate) {
          return `hsl(${(120 + index * 40) % 360}, 75%, 60%)`
        }
        return cat.color
      }
      return '#cbd5e1'
    })

    return {
      labels: labels.length > 0 ? labels : ['No Inflows'],
      datasets: [{
        data: data.length > 0 ? data : [1],
        backgroundColor: colors.length > 0 ? colors : ['#e2e8f0'],
        borderWidth: data.length > 0 ? 2 : 0,
        borderColor: theme === 'dark' ? '#111827' : '#ffffff',
        spacing: data.length > 0 ? 4 : 0,
        borderRadius: data.length > 0 ? 4 : 0
      }],
      raw: dict
    }
  }, [rangeTransactions, categories, theme])

  // Cumulative Net Balance Trend (Line Chart)
  const cumulativeTrendData = useMemo(() => {
    const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0)
    
    // Sort all transactions ascending
    const allSorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
    
    // Find index of first transaction in selected range
    const rangeStartIdx = allSorted.findIndex(t => new Date(t.date) >= dateBounds.start)

    // Calculate starting balance before the range starts
    let runningBalance = totalBalance
    // Wind back from total balance to starting balance
    for (let i = allSorted.length - 1; i >= (rangeStartIdx === -1 ? allSorted.length : rangeStartIdx); i--) {
      const t = allSorted[i]
      const amt = parseFloat(t.amount)
      if (t.type === 'income') {
        runningBalance -= amt
      } else if (t.type === 'expense') {
        runningBalance += amt
      } else if (t.type === 'transfer') {
        // internal transfers don't change net sum of all accounts
      }
    }

    const labels = []
    const data = []

    // Push starting baseline
    if (rangeTransactions.length > 0) {
      labels.push('Start')
      data.push(runningBalance)
    }

    rangeTransactions.forEach(t => {
      const amt = parseFloat(t.amount)
      if (t.type === 'income') runningBalance += amt
      if (t.type === 'expense') runningBalance -= amt
      
      labels.push(new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))
      data.push(runningBalance)
    })

    return {
      labels,
      datasets: [{
        label: 'Net Worth Path',
        data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        fill: true,
        tension: 0.3,
        pointRadius: rangeTransactions.length < 30 ? 3 : 0,
        pointBackgroundColor: '#6366f1'
      }]
    }
  }, [rangeTransactions, transactions, accounts, dateBounds])

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Note']
    const rows = rangeTransactions.map(tx => [
      tx.date,
      tx.type,
      tx.amount,
      `"${tx.note || ''}"`
    ])
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `paa_ai_report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in-up print:bg-white print:text-slate-900 print:p-0">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Reports & Financial Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Deep dive into your income distribution, expense categories, and net worth progress.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            <span>Print / PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Print-only title */}
      <div className="hidden print:block mb-8">
        <h1 className="text-4xl font-black text-indigo-700">Personal Account Assistant AI - Financial Audit Statement</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generated on {new Date().toLocaleDateString()} | Range: {dateRange} ({dateBounds.start.toLocaleDateString()} - {dateBounds.end.toLocaleDateString()})
        </p>
      </div>

      {/* Filters Hub */}
      <div className="glass-effect rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 font-semibold text-sm">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
            <span>Range:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 flex-grow">
            {[
              { id: 'today', name: 'Today' },
              { id: 'yesterday', name: 'Yesterday' },
              { id: '7-days', name: 'Last 7 Days' },
              { id: '30-days', name: 'Last 30 Days' },
              { id: 'this-month', name: 'This Month' },
              { id: 'last-month', name: 'Last Month' },
              { id: 'this-year', name: 'This Year' },
              { id: 'custom', name: 'Custom' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setDateRange(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dateRange === r.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* Custom range picker */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 max-w-md pt-2 animate-scale-in">
            <div>
              <label className="block text-4xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">From</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-4xs uppercase tracking-wider font-extrabold text-slate-400 mb-1">To</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI summaries cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Change */}
        <div className="bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-850/40 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/30 flex flex-col justify-between print:border-slate-350">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Net Cash Flow</span>
            <Activity className="h-4.5 w-4.5 text-indigo-500" />
          </div>
          <div className="mt-4">
            <h2 className={`text-2xl font-extrabold ${metrics.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {metrics.net >= 0 ? '+' : ''}${metrics.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-4xs text-slate-400 mt-1">Total revenue minus total cost</p>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-850/40 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/30 flex flex-col justify-between print:border-slate-350">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Total Inflow</span>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-emerald-500">
              ${metrics.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-4xs text-slate-400 mt-1">Sum of all income items</p>
          </div>
        </div>

        {/* Total Outflow */}
        <div className="bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-850/40 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/30 flex flex-col justify-between print:border-slate-350">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Total Outflow</span>
            <TrendingDown className="h-4.5 w-4.5 text-rose-500" />
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-rose-500">
              ${metrics.expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-4xs text-slate-400 mt-1">Sum of all expense items</p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-gradient-to-br from-white/95 to-slate-50/50 dark:from-slate-900/90 dark:to-slate-850/40 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/30 flex flex-col justify-between print:border-slate-350">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-2xs font-extrabold uppercase tracking-wider">Savings Rate</span>
            <Percent className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <div className="mt-4">
            <h2 className={`text-2xl font-bold ${metrics.savingsRate >= 20 ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'}`}>
              {metrics.savingsRate.toFixed(1)}%
            </h2>
            <p className="text-4xs text-slate-400 mt-1">Target is 20.0% or higher</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Net Worth Path Line Chart */}
        <div className="glass-effect rounded-2xl p-5 shadow-sm lg:col-span-2 print:border-slate-300">
          <h3 className="text-base font-bold mb-4 flex items-center gap-1.5">
            <Layers className="h-5 w-5 text-indigo-500" />
            Asset Curve (Cumulative Net Flow)
          </h3>
          <div className="h-64">
            <Line
              data={cumulativeTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'rgba(148, 163, 184, 0.05)' } }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Inflow vs Outflow Bar Chart */}
        <div className="glass-effect rounded-2xl p-5 shadow-sm print:border-slate-300">
          <h3 className="text-base font-bold mb-4 flex items-center gap-1.5">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Flow Comparison Over Time
          </h3>
          <div className="h-64">
            <Bar
              data={timeChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { grid: { color: 'rgba(148, 163, 184, 0.05)' } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Side-by-Side Doughnuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expense Category Breakdown */}
        <div className="glass-effect rounded-2xl p-5 shadow-sm print:border-slate-300">
          <h3 className="text-base font-bold mb-4 flex items-center gap-1.5">
            <PieIcon className="h-5 w-5 text-rose-500" />
            Outflows by Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-44 flex items-center justify-center relative">
              <Doughnut
                data={expenseCatData}
                options={{
                  plugins: { legend: { display: false } },
                  cutout: '70%',
                  maintainAspectRatio: false
                }}
              />
              <div className="absolute flex flex-col items-center">
                <span className="text-5xs text-slate-400 font-extrabold uppercase tracking-wider">Outflows</span>
                <span className="text-sm font-extrabold">${metrics.expenses.toFixed(0)}</span>
              </div>
            </div>
            {/* List */}
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {Object.keys(expenseCatData.raw).length === 0 ? (
                <p className="text-slate-400 text-center">No expense logs</p>
              ) : (
                Object.entries(expenseCatData.raw).map(([name, amt]) => {
                  const pct = metrics.expenses > 0 ? (amt / metrics.expenses) * 100 : 0
                  const cat = categories.find(c => c.name === name)
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || '#cbd5e1' }} />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-semibold">{name}</span>
                      </div>
                      <span className="font-bold text-slate-400 flex-shrink-0 ml-2">
                        ${amt.toFixed(0)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Income Category Breakdown */}
        <div className="glass-effect rounded-2xl p-5 shadow-sm print:border-slate-300">
          <h3 className="text-base font-bold mb-4 flex items-center gap-1.5">
            <PieIcon className="h-5 w-5 text-emerald-500" />
            Inflows by Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-44 flex items-center justify-center relative">
              <Doughnut
                data={incomeCatData}
                options={{
                  plugins: { legend: { display: false } },
                  cutout: '70%',
                  maintainAspectRatio: false
                }}
              />
              <div className="absolute flex flex-col items-center">
                <span className="text-5xs text-slate-400 font-extrabold uppercase tracking-wider">Inflows</span>
                <span className="text-sm font-extrabold">${metrics.income.toFixed(0)}</span>
              </div>
            </div>
            {/* List */}
            <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              {Object.keys(incomeCatData.raw).length === 0 ? (
                <p className="text-slate-400 text-center">No income logs</p>
              ) : (
                Object.entries(incomeCatData.raw).map(([name, amt]) => {
                  const pct = metrics.income > 0 ? (amt / metrics.income) * 100 : 0
                  const cat = categories.find(c => c.name === name)
                  return (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat?.color || '#cbd5e1' }} />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-semibold">{name}</span>
                      </div>
                      <span className="font-bold text-slate-400 flex-shrink-0 ml-2">
                        ${amt.toFixed(0)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable transactions auditing log */}
      <div className="glass-effect rounded-2xl p-5 shadow-sm">
        <h3 className="text-base font-bold mb-4">Detailed Statement Audit Log ({rangeTransactions.length} items)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-dark-border text-slate-400 uppercase font-extrabold">
                <th className="pb-2">Date</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Description / Note</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {rangeTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-slate-400">
                    No transactions match criteria for this timeframe.
                  </td>
                </tr>
              ) : (
                rangeTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="py-2">{t.date}</td>
                    <td className="py-2 capitalize font-semibold">{t.type}</td>
                    <td className="py-2 text-slate-700 dark:text-slate-300">{t.note || 'No description'}</td>
                    <td className={`py-2 text-right font-bold ${
                      t.type === 'income' ? 'text-emerald-500' : t.type === 'expense' ? 'text-rose-500' : 'text-slate-500'
                    }`}>
                      ${parseFloat(t.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
