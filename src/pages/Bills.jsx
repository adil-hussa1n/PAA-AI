import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Plus, Check, Clock, AlertTriangle, CreditCard } from 'lucide-react'

export const Bills = () => {
  const { bills, addBill, updateBill } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleAddBill = async (e) => {
    e.preventDefault()
    if (!title.trim() || !amount || !dueDate) return

    await addBill({
      title: title.trim(),
      amount: parseFloat(amount),
      due_date: dueDate,
      status: 'unpaid'
    })

    setTitle('')
    setAmount('')
    setDueDate('')
    setShowAddModal(false)
  }

  const toggleBillStatus = async (billId, currentStatus) => {
    const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    await updateBill(billId, { status: nextStatus })
  }

  const sortedBills = [...bills].sort((a, b) => new Date(a.due_date) - new Date(b.due_date))

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
            Bills & Due Dates
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Keep track of monthly utilities, subscriptions, and recurring invoices.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4.5 py-3 rounded-xl shadow-md cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>Add Invoice / Bill</span>
        </button>
      </div>

      {/* Bills display lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unpaid Bills */}
        <div className="glass-effect rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/40 space-y-4">
          <h3 className="font-bold text-lg text-amber-500 flex items-center gap-2">
            <Clock className="h-5 w-5" /> Unpaid Obligations
          </h3>
          <div className="space-y-3">
            {sortedBills.filter(b => b.status === 'unpaid').length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">All bills paid! You have no upcoming dues.</p>
            ) : (
              sortedBills.filter(b => b.status === 'unpaid').map((b) => {
                const isOverdue = new Date(b.due_date) < new Date()
                return (
                  <div key={b.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleBillStatus(b.id, b.status)}
                        className="h-6.5 w-6.5 rounded-lg border border-slate-300 dark:border-dark-border flex items-center justify-center hover:border-indigo-500 cursor-pointer"
                      >
                        {/* Empty box */}
                      </button>
                      <div>
                        <p className="font-bold text-sm">{b.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          Due: {new Date(b.due_date).toLocaleDateString()}
                          {isOverdue && <span className="text-rose-500 font-extrabold flex items-center gap-0.5"><AlertTriangle className="h-3.5 w-3.5" /> OVERDUE</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-base text-rose-500">${parseFloat(b.amount).toFixed(2)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Paid Bills Archive */}
        <div className="glass-effect rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-dark-border/40 space-y-4">
          <h3 className="font-bold text-lg text-emerald-500 flex items-center gap-2">
            <Check className="h-5 w-5" /> Cleared Dues
          </h3>
          <div className="space-y-3">
            {sortedBills.filter(b => b.status === 'paid').length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No paid bills logged yet.</p>
            ) : (
              sortedBills.filter(b => b.status === 'paid').map((b) => (
                <div key={b.id} className="p-4 bg-slate-50/60 dark:bg-slate-800/20 rounded-xl flex items-center justify-between opacity-75">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleBillStatus(b.id, b.status)}
                      className="h-6.5 w-6.5 rounded-lg bg-emerald-500 text-white flex items-center justify-center cursor-pointer"
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                    <div>
                      <p className="font-semibold text-sm line-through text-slate-400">{b.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Cleared</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-slate-400">${parseFloat(b.amount).toFixed(2)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Bill */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-dark-border animate-scale-in max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold">Add Invoice / Due Bill</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddBill} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Bill Title / Invoice</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric Bill, Rent, Gym Subscription"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-0 focus:ring-2 focus:ring-indigo-500 text-sm focus:outline-none"
                />
              </div>

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

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
