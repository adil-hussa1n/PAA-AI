import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ChevronLeft, ChevronRight, HelpCircle, CalendarDays } from 'lucide-react'

export const CalendarView = () => {
  const { transactions } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDayTxs, setSelectedDayTxs] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Names of days
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Get first day of month
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Generate date blocks
  const calendarCells = []
  // Empty slots for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null)
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(year, month, d))
  }

  // Next month helper
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDayTxs(null)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDayTxs(null)
  }

  // Get transactions for a given date
  const getDayTransactions = (cellDate) => {
    if (!cellDate) return []
    const compareStr = cellDate.toISOString().split('T')[0]
    return transactions.filter(t => t.date === compareStr)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Calendar View
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse transaction volumes across dates in a calendar grid.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border px-4 py-2 rounded-xl shadow-sm">
          <button onClick={prevMonth} className="p-1 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-extrabold text-sm min-w-[120px] text-center">
            {months[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1 text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-effect rounded-2xl p-5 border border-slate-200/50 dark:border-dark-border/40 shadow-sm">
          {/* Days Label Row */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
            {daysOfWeek.map(d => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-20 bg-slate-50/20 dark:bg-slate-800/10 rounded-xl" />
              }

              const dayTxs = getDayTransactions(cell)
              const incSum = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
              const expSum = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
              const isToday = new Date().toDateString() === cell.toDateString()

              return (
                <div
                  key={`day-${cell.getDate()}`}
                  onClick={() => setSelectedDayTxs({ date: cell.toLocaleDateString(), txs: dayTxs })}
                  className={`h-20 p-2 border rounded-xl flex flex-col justify-between cursor-pointer hover:border-indigo-500 transition duration-150 relative overflow-hidden ${
                    isToday
                      ? 'border-indigo-500 bg-indigo-50/10'
                      : 'border-slate-100 dark:border-dark-border/40 bg-white/40 dark:bg-dark-card/30'
                  }`}
                >
                  <span className={`text-xs font-extrabold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {cell.getDate()}
                  </span>

                  {dayTxs.length > 0 && (
                    <div className="space-y-0.5">
                      {incSum > 0 && (
                        <div className="text-4xs font-bold text-emerald-500 bg-emerald-500/5 px-1 py-0.5 rounded truncate">
                          +${incSum.toFixed(0)}
                        </div>
                      )}
                      {expSum > 0 && (
                        <div className="text-4xs font-bold text-rose-500 bg-rose-500/5 px-1 py-0.5 rounded truncate">
                          -${expSum.toFixed(0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Day details */}
        <div className="glass-effect rounded-2xl p-5 border border-slate-200/50 dark:border-dark-border/40 shadow-sm min-h-[350px] flex flex-col justify-between">
          {selectedDayTxs ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-3">
                <div>
                  <h3 className="font-extrabold text-base">{selectedDayTxs.date}</h3>
                  <p className="text-xs text-slate-400">Transactions Ledger</p>
                </div>
                <button onClick={() => setSelectedDayTxs(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1">
                {selectedDayTxs.txs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No transactions recorded on this day.</p>
                ) : (
                  selectedDayTxs.txs.map(tx => {
                    const isInc = tx.type === 'income'
                    return (
                      <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold">{tx.note || 'No description'}</p>
                          <span className="text-4xs uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-extrabold">
                            {tx.type}
                          </span>
                        </div>
                        <span className={`font-extrabold ${isInc ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isInc ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400">
              <CalendarDays className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-semibold">Select a Date</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Click any calendar cell to view transactions for that date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
