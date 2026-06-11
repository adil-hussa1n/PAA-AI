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
      default:
        return <Dashboard onAddTransactionClick={handleOpenAdd} />
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-bold text-sm tracking-wide">Syncing local accounts ledger...</p>
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
        <div className="max-w-7xl mx-auto">
          {renderActivePage()}
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
