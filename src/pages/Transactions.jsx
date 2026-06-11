import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Search,
  SlidersHorizontal,
  Download,
  Trash2,
  Edit2,
  Plus,
  Paperclip,
  Calendar,
  X,
  ExternalLink,
  RotateCcw
} from 'lucide-react'

export const Transactions = ({ onAddClick, onEditClick }) => {
  const {
    transactions,
    accounts,
    categories,
    parties,
    deleteTransaction,
    history,
    undoTransactionChange,
    redoTransactionChange,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters
  } = useApp()

  const [showFilters, setShowFilters] = useState(false)

  // CSV Export Utility
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Account', 'To Account', 'Category', 'Party', 'Note']
    const rows = filteredTransactions.map(tx => {
      const acc = accounts.find(a => a.id === tx.account_id)?.name || ''
      const toAcc = tx.to_account_id ? accounts.find(a => a.id === tx.to_account_id)?.name || '' : ''
      const cat = categories.find(c => c.id === tx.category_id)?.name || ''
      const party = parties.find(p => p.id === tx.party_id)?.name || ''
      return [
        tx.date,
        tx.type,
        tx.amount,
        `"${acc}"`,
        `"${toAcc}"`,
        `"${cat}"`,
        `"${party}"`,
        `"${tx.note || ''}"`
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `paa_ai_transactions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtering Logic
  const filteredTransactions = transactions.filter((tx) => {
    // Search check
    const matchesSearch =
      (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.amount.toString().includes(searchQuery)

    // Type check
    const matchesType = filters.type === 'all' || tx.type === filters.type

    // Account check
    const matchesAccount =
      filters.accountId === 'all' ||
      tx.account_id === filters.accountId ||
      tx.to_account_id === filters.accountId

    // Category check
    const matchesCategory = filters.categoryId === 'all' || tx.category_id === filters.categoryId

    // Party check
    const matchesParty = filters.partyId === 'all' || tx.party_id === filters.partyId

    // Date range check
    const matchesStartDate = !filters.startDate || new Date(tx.date) >= new Date(filters.startDate)
    const matchesEndDate = !filters.endDate || new Date(tx.date) <= new Date(filters.endDate)

    return (
      matchesSearch &&
      matchesType &&
      matchesAccount &&
      matchesCategory &&
      matchesParty &&
      matchesStartDate &&
      matchesEndDate
    )
  })

  // Group transactions by date for a nice timeline layout
  const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
    const date = tx.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(tx)
    return groups
  }, {})

  // Sort dates descending
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a))

  const resetFilters = () => {
    setFilters({
      type: 'all',
      accountId: 'all',
      categoryId: 'all',
      partyId: 'all',
      startDate: '',
      endDate: ''
    })
    setSearchQuery('')
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Transactions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Browse and filter your income, expenses, and account transfers.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* History Undo/Redo quick controls */}
          {history.past.length > 0 && (
            <button
              onClick={undoTransactionChange}
              title="Undo last change"
              className="p-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 px-4.5 py-3 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={onAddClick}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Add Ledger</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-effect rounded-2xl p-4.5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search note or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10.5 pr-4 py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4.5 py-3 rounded-xl border border-slate-200 dark:border-dark-border text-sm font-semibold transition cursor-pointer ${
              showFilters
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400'
                : 'bg-white dark:bg-dark-card text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-3 border-t border-slate-100 dark:border-dark-border animate-scale-in">
            {/* Filter by Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500 text-xs focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            {/* Filter by Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Account</label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500 text-xs focus:outline-none"
              >
                <option value="all">All Accounts</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500 text-xs focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Party */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Party</label>
              <select
                value={filters.partyId}
                onChange={(e) => setFilters({ ...filters, partyId: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500 text-xs focus:outline-none"
              >
                <option value="all">All Parties</option>
                {parties.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">From</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500 text-xs focus:outline-none"
              />
            </div>

            {/* Date Range End */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">To</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border-0 focus:ring-2 focus:ring-indigo-500 text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Filters Active indicator */}
        {(searchQuery || Object.values(filters).some(v => v !== 'all' && v !== '')) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-border text-xs">
            <span className="font-semibold text-slate-400">
              Found {filteredTransactions.length} transactions match filters.
            </span>
            <button
              onClick={resetFilters}
              className="text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="glass-effect rounded-2xl p-12 text-center shadow-sm">
            <SlidersHorizontal className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold">No Transactions Found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              There are no ledger entries matching your current search query or filter criteria. Try expanding your parameters.
            </p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const dateObj = new Date(dateStr)
            const dateLabel = dateObj.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            const dayTxs = groupedTransactions[dateStr]

            return (
              <div key={dateStr} className="space-y-2">
                {/* Timeline Date Header */}
                <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-2">
                  {dateLabel}
                </h4>

                <div className="glass-effect rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-dark-border/40 divide-y divide-slate-100 dark:divide-dark-border">
                  {dayTxs.map((tx) => {
                    const acc = accounts.find((a) => a.id === tx.account_id)
                    const toAcc = tx.to_account_id ? accounts.find((a) => a.id === tx.to_account_id) : null
                    const cat = categories.find((c) => c.id === tx.category_id)
                    const party = parties.find((p) => p.id === tx.party_id)
                    
                    const isIncome = tx.type === 'income'
                    const isExpense = tx.type === 'expense'
                    const isTransfer = tx.type === 'transfer'

                    return (
                      <div
                        key={tx.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition duration-150 group"
                      >
                        {/* Transaction Icon / Details */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Transaction Type Indicator */}
                          <div
                            className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0 ${
                              isIncome
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : isTransfer
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? 'IN' : isTransfer ? 'TR' : 'OUT'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                                {tx.note || 'No description'}
                              </span>
                              
                              {/* Party Badge */}
                              {party && (
                                <span className="inline-flex items-center text-2xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                  {party.name}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                              {/* Account label */}
                              <span>{acc ? acc.name : 'Unknown Account'}</span>
                              {isTransfer && toAcc && (
                                <>
                                  <span>→</span>
                                  <span>{toAcc.name}</span>
                                </>
                              )}
                              <span>•</span>
                              {/* Category label */}
                              {isTransfer ? (
                                <span className="font-medium text-slate-500">Internal Transfer</span>
                              ) : (
                                <span
                                  className="font-semibold"
                                  style={{ color: cat ? cat.color : '#94a3b8' }}
                                >
                                  {cat ? cat.name : 'Uncategorized'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount & Quick Actions */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p
                              className={`text-base font-extrabold ${
                                isIncome
                                  ? 'text-emerald-500'
                                  : isTransfer
                                  ? 'text-slate-500 dark:text-slate-400'
                                  : 'text-rose-500'
                              }`}
                            >
                              {isIncome ? '+' : isTransfer ? '' : '-'}${parseFloat(tx.amount).toFixed(2)}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => onEditClick(tx)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Edit2 className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(tx.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
