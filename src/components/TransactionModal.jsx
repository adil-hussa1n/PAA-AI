import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Paperclip, Sparkles, AlertCircle } from 'lucide-react'

export const TransactionModal = ({ txToEdit, onClose }) => {
  const {
    accounts,
    categories,
    parties,
    addTransaction,
    editTransaction,
    getSuggestedCategory,
    uploadAttachment
  } = useApp()

  // Form State
  const [type, setType] = useState('expense')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [partyId, setPartyId] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedFile, setSelectedFile] = useState(null)

  // AI suggestion state
  const [suggestedCat, setSuggestedCat] = useState(null)

  useEffect(() => {
    // Populate if editing
    if (txToEdit) {
      setType(txToEdit.type)
      setAccountId(txToEdit.account_id)
      setToAccountId(txToEdit.to_account_id || '')
      setAmount(txToEdit.amount)
      setCategoryId(txToEdit.category_id || '')
      setPartyId(txToEdit.party_id || '')
      setNote(txToEdit.note || '')
      setDate(txToEdit.date)
    } else {
      // Set default account if available
      if (accounts.length > 0) {
        setAccountId(accounts[0].id)
      }
    }
  }, [txToEdit, accounts])

  // Monitor note input for AI category suggestions
  useEffect(() => {
    if (type !== 'transfer' && note.trim().length > 2) {
      const suggestion = getSuggestedCategory(note)
      if (suggestion && suggestion.type === type) {
        setSuggestedCat(suggestion)
      } else {
        setSuggestedCat(null)
      }
    } else {
      setSuggestedCat(null)
    }
  }, [note, type, getSuggestedCategory])

  const handleApplySuggestion = () => {
    if (suggestedCat) {
      setCategoryId(suggestedCat.id)
      setSuggestedCat(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!accountId || !amount) return
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return

    const payload = {
      account_id: accountId,
      to_account_id: type === 'transfer' ? toAccountId : null,
      type,
      amount: amt,
      category_id: type === 'transfer' ? null : (categoryId || null),
      party_id: type === 'transfer' ? null : (partyId || null),
      note: note.trim(),
      date
    }

    try {
      let savedTx
      if (txToEdit) {
        await editTransaction(txToEdit.id, payload)
        savedTx = { id: txToEdit.id, ...payload }
      } else {
        savedTx = await addTransaction(payload)
      }

      // Handle Attachment upload if selected
      if (selectedFile && savedTx) {
        await uploadAttachment(savedTx.id, selectedFile)
      }

      onClose()
    } catch (err) {
      console.error('Submit transaction failed:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {txToEdit ? 'Edit Transaction Ledger' : 'Add New Transaction'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto">
          {/* Transaction Type Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['expense', 'income', 'transfer'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t)
                    setCategoryId('')
                    setPartyId('')
                  }}
                  className={`py-2.5 rounded-xl text-xs font-bold border capitalize transition cursor-pointer ${
                    type === t
                      ? t === 'expense' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900' :
                        t === 'income' ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900' :
                        'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900'
                      : 'border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">
                {type === 'transfer' ? 'Source Wallet' : 'Account'}
              </label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
              >
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} (${parseFloat(acc.balance).toFixed(2)})</option>
                ))}
              </select>
            </div>

            {/* To Account (only for Transfers) */}
            {type === 'transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Destination Wallet</label>
                <select
                  required
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (${parseFloat(acc.balance).toFixed(2)})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Amount ($)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
              />
            </div>
          </div>

          {type !== 'transfer' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">Uncategorized</option>
                  {categories
                    .filter(c => c.type === type)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  }
                </select>
              </div>

              {/* Party */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Party / Contact</label>
                <select
                  value={partyId}
                  onChange={(e) => setPartyId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                >
                  <option value="">None</option>
                  {parties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Date & Receipt Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
              />
            </div>

            {/* Attachment Receipt */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Receipt Attachment</label>
              <div className="relative flex items-center justify-center p-3 border border-dashed border-slate-200 dark:border-dark-border rounded-xl bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Paperclip className="h-4.5 w-4.5 text-indigo-500" />
                  <span>{selectedFile ? selectedFile.name : 'Upload receipt file'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Note / Payee Name</label>
            <input
              type="text"
              placeholder="e.g. Uber Ride, Weekly Groceries, Dinner Party"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
            />
          </div>

          {/* AI Category Suggestion Banner */}
          {suggestedCat && (
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-between text-xs animate-scale-in">
              <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4 animate-spin" />
                AI suggests category: <strong className="font-extrabold">{suggestedCat.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1 rounded-lg transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-3 border border-slate-200 dark:border-dark-border rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md transition cursor-pointer"
            >
              Save Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
