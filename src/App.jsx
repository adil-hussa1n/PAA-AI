import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { Sidebar } from './components/Sidebar'
import { ToastContainer } from './components/Toast'
import { Dashboard } from './pages/Dashboard'
import { Transactions } from './pages/Transactions'
import { Accounts } from './pages/Accounts'
import { Categories } from './pages/Categories'
import { Parties } from './pages/Parties'
import { Budgets } from './pages/Budgets'
import { Bills } from './pages/Bills'
import { CalendarView } from './pages/CalendarView'
import { Insights } from './pages/Insights'
import { Reports } from './pages/Reports'
import { Auth } from './pages/Auth'
import { TransactionModal } from './components/TransactionModal'
import './index.css'

function AppContent() {
  const { activeTab, loading, user } = useApp()
  const [showTxModal, setShowTxModal] = useState(false)
  const [txToEdit, setTxToEdit] = useState(null)

  const handleOpenAdd = () => {
    setTxToEdit(null)
    setShowTxModal(true)
  }

  const handleOpenEdit = (tx) => {
    setTxToEdit(tx)
    setShowTxModal(true)
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onAddTransactionClick={handleOpenAdd} />
      case 'transactions':
        return <Transactions onAddClick={handleOpenAdd} onEditClick={handleOpenEdit} />
      case 'accounts':
        return <Accounts />
      case 'categories':
        return <Categories />
      case 'parties':
        return <Parties />
      case 'budgets':
        return <Budgets />
      case 'bills':
        return <Bills />
      case 'calendar':
        return <CalendarView />
      case 'insights':
        return <Insights />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard onAddTransactionClick={handleOpenAdd} />
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-3xl opacity-60 dark:opacity-40 animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-600/10 to-blue-500/10 blur-3xl opacity-50 dark:opacity-30 pointer-events-none" />

        <div className="flex flex-col items-center gap-6 z-10 animate-fade-in text-center px-4">
          {/* Logo container with heartbeat pulse & shadow */}
          <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30 animate-pulse relative">
            PAA
            <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 blur opacity-40 animate-pulse -z-10" />
          </div>

          <div className="space-y-2.5">
            <h3 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent m-0">
              Personal Account Assistant AI
            </h3>
            <p className="text-2xs font-semibold uppercase tracking-widest text-indigo-650 dark:text-indigo-400">
              Smart Finance, Powered by GraffixInnovation
            </p>
          </div>

          {/* Smooth custom progressive track loader */}
          <div className="w-56 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-loader-progress absolute left-0 top-0 w-1/3" />
          </div>
          
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 animate-pulse mt-1">
            Synchronizing ledger balances...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 text-slate-900 dark:bg-dark-bg dark:text-slate-100">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content display */}
      <main className="flex-grow overflow-x-hidden md:max-h-screen md:overflow-y-auto">
        <div className="max-w-7xl mx-auto min-h-screen flex flex-col justify-between">
          <div className="flex-grow">
            {renderActivePage()}
          </div>

          {/* Footer branding */}
          <footer className="py-8 px-6 border-t border-slate-200/30 dark:border-dark-border/30 text-center space-y-2 print:hidden mt-8">
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-black tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent uppercase">
                Personal Account Assistant AI
              </span>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold tracking-wide mt-1">
                "Smart Finance, Powered by GraffixInnovation"
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Designed & Developed by{' '}
              <a
                href="https://www.graffixinnovation.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-500 hover:text-indigo-600 transition duration-150"
              >
                GraffixInnovation
              </a>
            </p>
          </footer>
        </div>
      </main>

      {/* Modal for adding/editing transaction */}
      {showTxModal && (
        <TransactionModal
          txToEdit={txToEdit}
          onClose={() => setShowTxModal(false)}
        />
      )}

      {/* Notification system */}
      <ToastContainer />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
