import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Users, Plus, Phone, Mail, ArrowUpRight, ArrowDownLeft, X, Notebook } from 'lucide-react'

export const Parties = () => {
  const { parties, addParty, transactions, accounts } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [selectedParty, setSelectedParty] = useState(null)

  const handleAddParty = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    await addParty({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      balance: 0.00
    })

    setName('')
    setPhone('')
    setEmail('')
    setShowAddModal(false)
  }

  // Get transaction ledger of selected party
  const getPartyTransactions = (partyId) => {
    return transactions.filter(t => t.party_id === partyId)
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Parties & Debts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Keep track of money you owe or are owed by contacts and organizations.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>New Contact</span>
        </button>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parties List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parties.map((p) => {
              const bal = parseFloat(p.balance)
              const owesUs = bal > 0
              const weOwe = bal < 0

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedParty(p)}
                  className={`bg-gradient-to-br from-white/90 to-white/40 dark:from-slate-900/90 dark:to-slate-900/40 backdrop-blur-md rounded-2xl p-5 shadow-md border cursor-pointer hover:scale-[1.01] transition duration-300 relative overflow-hidden ${
                    selectedParty?.id === p.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-200/50 dark:border-dark-border/30'
                  }`}
                >
                  {/* Left Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    owesUs ? 'bg-emerald-500' :
                    weOwe ? 'bg-rose-500' :
                    'bg-slate-300 dark:bg-slate-700'
                  }`} />
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{p.name}</h3>
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                      <Users className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  {/* Balance details */}
                  <div className="mt-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Credit Status</p>
                    <p className={`text-xl font-extrabold mt-1 ${
                      owesUs ? 'text-emerald-500' :
                      weOwe ? 'text-rose-500' :
                      'text-slate-400'
                    }`}>
                      {owesUs ? `They Owe You: $${bal.toFixed(2)}` :
                       weOwe ? `You Owe Them: $${Math.abs(bal).toFixed(2)}` :
                       'Balanced ($0.00)'}
                    </p>
                  </div>

                  {/* Contact Info indicators */}
                  <div className="mt-4.5 flex gap-3 text-xs text-slate-400">
                    {p.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>}
                    {p.email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {p.email}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Party Ledger Drawer */}
        <div className="glass-effect rounded-2xl p-5 shadow-md border border-slate-200/50 dark:border-dark-border/40 flex flex-col justify-between min-h-[400px]">
          {selectedParty ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border/60 pb-3">
                <div>
                  <h3 className="font-bold text-lg">{selectedParty.name}</h3>
                  <p className="text-xs text-indigo-500 font-medium">Contact Ledger</p>
                </div>
                <button onClick={() => setSelectedParty(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              {/* Transactions List */}
              <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
                {getPartyTransactions(selectedParty.id).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No transactions logged with this party.</p>
                ) : (
                  getPartyTransactions(selectedParty.id).map((tx) => {
                    const isIncome = tx.type === 'income'
                    return (
                      <div key={tx.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold">{tx.note || 'Transaction'}</p>
                          <p className="text-slate-400 text-3xs mt-0.5">{tx.date}</p>
                        </div>
                        <span className={`font-bold ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isIncome ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 text-slate-400">
              <Notebook className="h-10 w-10 mb-3 text-slate-300" />
              <p className="text-sm font-semibold">Select a Contact</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Click any contact card to view their transaction logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Party */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Add Contact / Party</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddParty} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe, Rent Landlord, Microsoft Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. billing@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
