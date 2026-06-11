import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Wallet, Landmark, CreditCard, Smartphone, HelpCircle, Plus, ArrowRightLeft, Check } from 'lucide-react'

export const Accounts = () => {
  const { accounts, addAccount, addTransaction } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)

  // Add Account form state
  const [name, setName] = useState('')
  const [type, setType] = useState('Bank')
  const [initialBalance, setInitialBalance] = useState('')

  // Transfer Money form state
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0])

  const getAccountIcon = (accType) => {
    switch (accType) {
      case 'Bank': return <Landmark className="h-6 w-6" />
      case 'Cash': return <Wallet className="h-6 w-6" />
      case 'Mobile Wallet': return <Smartphone className="h-6 w-6" />
      case 'Credit Card': return <CreditCard className="h-6 w-6" />
      default: return <HelpCircle className="h-6 w-6" />
    }
  }

  const handleAddAccount = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const bal = parseFloat(initialBalance) || 0.00
    
    await addAccount({
      name,
      type,
      balance: bal
    })

    // If initial balance is more than 0, create a starting balance transaction
    if (bal !== 0) {
      // Find the account we just created (wait, dbService returns it or we can find it)
      // Since dbService creates random uuid, we can just trigger it after loading or trust the trigger updates.
      // Actually, we can add a transaction of type 'income' as 'Starting Balance'
      // But addAccount handles baseline balance directly in our dbService.
    }

    // Reset fields
    setName('')
    setType('Bank')
    setInitialBalance('')
    setShowAddModal(false)
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (!fromAccount || !toAccount || fromAccount === toAccount) return
    const amt = parseFloat(transferAmount)
    if (!amt || amt <= 0) return

    await addTransaction({
      account_id: fromAccount,
      to_account_id: toAccount,
      type: 'transfer',
      amount: amt,
      note: transferNote.trim() || 'Internal Transfer',
      date: transferDate,
      category_id: null,
      party_id: null
    })

    // Reset fields
    setFromAccount('')
    setToAccount('')
    setTransferAmount('')
    setTransferNote('')
    setShowTransferModal(false)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Accounts & Wallets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your physical cash, bank accounts, cards, and mobile wallets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center justify-center gap-2 px-4.5 py-3 border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl shadow-sm transition cursor-pointer"
          >
            <ArrowRightLeft className="h-5 w-5 text-indigo-500" />
            <span>Transfer Money</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>New Wallet</span>
          </button>
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => {
          const isCredit = acc.type === 'Credit Card'
          const isNegative = parseFloat(acc.balance) < 0

          return (
            <div
              key={acc.id}
              className="bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-6 shadow-md hover:shadow-xl border border-slate-200/50 dark:border-dark-border/30 relative overflow-hidden group hover:scale-[1.01] hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition duration-300"
            >
              {/* Left Accent Bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {acc.type}
                </span>
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  {getAccountIcon(acc.type)}
                </div>
              </div>

              {/* Title & Balance */}
              <div className="mt-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{acc.name}</h3>
                <p className={`text-3xl font-extrabold mt-2 tracking-tight ${
                  isNegative ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                }`}>
                  ${parseFloat(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Card Footer details */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-border/60 flex justify-between text-xs text-slate-400">
                <span>Status: Active</span>
                <span>ID: {acc.id.substring(0, 8)}...</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal: Add Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold">Create Wallet / Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank of America, Cash, bKash Wallet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="Bank">Bank Account / checking</option>
                  <option value="Cash">Physical Cash Wallet</option>
                  <option value="Mobile Wallet">Mobile Wallet / Payment App</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Initial Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transfer Money */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold">Transfer Money Internally</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleTransfer} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Source Account (From)</label>
                <select
                  required
                  value={fromAccount}
                  onChange={(e) => setFromAccount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">Select source account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${parseFloat(acc.balance).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Destination Account (To)</label>
                <select
                  required
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">Select destination account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${parseFloat(acc.balance).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Amount ($)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Note</label>
                <input
                  type="text"
                  placeholder="e.g. ATM withdraw, bank transfer"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Date</label>
                <input
                  type="date"
                  required
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
