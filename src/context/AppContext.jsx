import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { dbService } from '../services/dbService'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient'
import { suggestCategory } from '../utils/aiSuggester'
import { calculateFinancialHealth } from '../utils/healthCalculator'

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  // Authentication & UI Navigation
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [theme, setTheme] = useState('dark')

  // Core Data Lists
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [parties, setParties] = useState([])
  const [budgets, setBudgets] = useState([])
  const [goals, setGoals] = useState([])
  const [bills, setBills] = useState([])
  const [recurringTemplates, setRecurringTemplates] = useState([])

  // Undo/Redo Stack for Transactions
  const [history, setHistory] = useState({
    past: [],
    future: []
  })

  // Toasts Notifications
  const [toasts, setToasts] = useState([])

  // Filters and Search State (for Transactions list)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'income', 'expense', 'transfer'
    accountId: 'all',
    categoryId: 'all',
    partyId: 'all',
    startDate: '',
    endDate: ''
  })

  // Toast Helpers
  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Toggle Theme (Dark / Light)
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(nextTheme)
      localStorage.setItem('paa_theme', nextTheme)
    }
  }

  const checkAndPostRecurringTxs = useCallback(async (templatesList) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const dueTemplates = templatesList.filter(t => t.active && t.next_run_date && t.next_run_date <= todayStr)
    
    if (dueTemplates.length === 0) return

    let updatedTemplates = [...templatesList]
    let txsToAdd = []

    for (let t of dueTemplates) {
      const txPayload = {
        account_id: t.account_id,
        to_account_id: null,
        type: t.type,
        amount: parseFloat(t.amount),
        category_id: t.category_id,
        party_id: null,
        note: `[Recurring] ${t.title}`,
        date: t.next_run_date
      }
      
      txsToAdd.push(txPayload)

      const nextRun = new Date(t.next_run_date)
      if (t.frequency === 'daily') {
        nextRun.setDate(nextRun.getDate() + 1)
      } else if (t.frequency === 'weekly') {
        nextRun.setDate(nextRun.getDate() + 7)
      } else if (t.frequency === 'monthly') {
        nextRun.setMonth(nextRun.getMonth() + 1)
      } else if (t.frequency === 'yearly') {
        nextRun.setFullYear(nextRun.getFullYear() + 1)
      }
      const nextRunStr = nextRun.toISOString().split('T')[0]

      await dbService.updateRecurringTemplate(t.id, { next_run_date: nextRunStr })
      updatedTemplates = updatedTemplates.map(item => item.id === t.id ? { ...item, next_run_date: nextRunStr } : item)
    }

    if (txsToAdd.length > 0) {
      const addedTxs = []
      for (let tx of txsToAdd) {
        const newTx = await dbService.addTransaction(tx)
        addedTxs.push(newTx)
      }

      setTransactions(prev => [...prev, ...addedTxs])
      setRecurringTemplates(updatedTemplates)

      const accs = await dbService.getAccounts()
      setAccounts(accs)

      showToast(`Processed ${txsToAdd.length} recurring transactions!`, 'success')
    }
  }, [showToast])

  // Load Initial Data from dbService
  const loadData = async () => {
    const startTime = Date.now()
    try {
      setLoading(true)
      const session = await dbService.getSession()
      setUser(session ? session.user : null)

      const [accs, txs, cats, pts, bdgs, gls, bls, recs] = await Promise.all([
        dbService.getAccounts(),
        dbService.getTransactions(),
        dbService.getCategories(),
        dbService.getParties(),
        dbService.getBudgets(),
        dbService.getGoals(),
        dbService.getBills(),
        dbService.getRecurringTemplates()
      ])

      setAccounts(accs || [])
      setTransactions(txs || [])
      setCategories(cats || [])
      setParties(pts || [])
      setBudgets(bdgs || [])
      setGoals(gls || [])
      setBills(bls || [])
      setRecurringTemplates(recs || [])

      if (recs && recs.length > 0) {
        await checkAndPostRecurringTxs(recs)
      }
    } catch (err) {
      console.error('Failed to load application data:', err)
      showToast('Error loading details. Using local backup.', 'error')
    } finally {
      const elapsedTime = Date.now() - startTime
      const minDuration = 1000 // 1 second minimum display to avoid flash
      if (elapsedTime < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsedTime))
      }
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    let authSubscription = null
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth Event]', event, session?.user?.email)

        if (event === 'SIGNED_IN') {
          if (session) {
            setUser(session.user)
            // Clean up verification hash from URL if present
            const hash = window.location.hash
            if (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=recovery')) {
              showToast('Email verified successfully! Welcome to Personal Account Assistant AI.', 'success')
              window.history.replaceState(null, null, window.location.pathname)
            }
            // Reload all data for the newly authenticated user
            try {
              const [accs, txs, cats, pts, bdgs, gls, bls, recs] = await Promise.all([
                dbService.getAccounts(),
                dbService.getTransactions(),
                dbService.getCategories(),
                dbService.getParties(),
                dbService.getBudgets(),
                dbService.getGoals(),
                dbService.getBills(),
                dbService.getRecurringTemplates()
              ])
              setAccounts(accs || [])
              setTransactions(txs || [])
              setCategories(cats || [])
              setParties(pts || [])
              setBudgets(bdgs || [])
              setGoals(gls || [])
              setBills(bls || [])
              setRecurringTemplates(recs || [])
              if (recs && recs.length > 0) {
                await checkAndPostRecurringTxs(recs)
              }
              setLoading(false)
            } catch (err) {
              console.error('Failed to reload data after sign-in:', err)
            }
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (session) setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        } else if (event === 'USER_UPDATED') {
          if (session) setUser(session.user)
        }
      })
      authSubscription = data.subscription
    }

    // Load theme setting
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('paa_theme') || 'dark'
      setTheme(savedTheme)
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(savedTheme)
    }

    return () => {
      if (authSubscription) authSubscription.unsubscribe()
    }
  }, [showToast, checkAndPostRecurringTxs])

  // --- UNDO / REDO TRANSACTIONS ENGINE ---
  const saveToHistory = (newTransactionsList) => {
    setHistory((prev) => ({
      past: [...prev.past.slice(-9), transactions], // Keep last 10 versions
      future: []
    }))
    setTransactions(newTransactionsList)
  }

  const undoTransactionChange = () => {
    if (history.past.length === 0) return
    const previous = history.past[history.past.length - 1]
    const remainingPast = history.past.slice(0, -1)

    setHistory({
      past: remainingPast,
      future: [transactions, ...history.future]
    })
    
    // Update db storage values
    // In a real DB sync, this would push updates. Here we align database to the undone state.
    localStorage.setItem('paa_transactions', JSON.stringify(previous))
    // Trigger balance update locally
    setTransactions(previous)
    // Recalculate
    setTimeout(async () => {
      const accs = await dbService.getAccounts()
      const pts = await dbService.getParties()
      setAccounts(accs)
      setParties(pts)
    }, 50)
    
    showToast('Transaction list undone!', 'info')
  };

  const redoTransactionChange = () => {
    if (history.future.length === 0) return
    const next = history.future[0]
    const remainingFuture = history.future.slice(1)

    setHistory((prev) => ({
      past: [...prev.past, transactions],
      future: remainingFuture
    }))

    localStorage.setItem('paa_transactions', JSON.stringify(next))
    setTransactions(next)
    setTimeout(async () => {
      const accs = await dbService.getAccounts()
      const pts = await dbService.getParties()
      setAccounts(accs)
      setParties(pts)
    }, 50)

    showToast('Transaction list redone!', 'info')
  }

  // --- CRUD ACTIONS ---

  // Transactions CRUD
  const addTransaction = async (tx) => {
    try {
      const newTx = await dbService.addTransaction(tx)
      saveToHistory([...transactions, newTx])
      
      // Update accounts and parties balances
      const [accs, pts] = await Promise.all([dbService.getAccounts(), dbService.getParties()])
      setAccounts(accs)
      setParties(pts)
      showToast('Transaction added successfully!')
      return newTx
    } catch (err) {
      showToast('Failed to add transaction.', 'error')
    }
  }

  const editTransaction = async (id, updates) => {
    try {
      const updatedTx = await dbService.updateTransaction(id, updates)
      const newTxList = transactions.map(t => t.id === id ? updatedTx : t)
      saveToHistory(newTxList)

      const [accs, pts] = await Promise.all([dbService.getAccounts(), dbService.getParties()])
      setAccounts(accs)
      setParties(pts)
      showToast('Transaction updated successfully!')
    } catch (err) {
      showToast('Failed to update transaction.', 'error')
    }
  }

  const deleteTransaction = async (id) => {
    try {
      await dbService.deleteTransaction(id)
      const newTxList = transactions.filter(t => t.id !== id)
      saveToHistory(newTxList)

      const [accs, pts] = await Promise.all([dbService.getAccounts(), dbService.getParties()])
      setAccounts(accs)
      setParties(pts)
      showToast('Transaction deleted successfully! Click Undo in notifications if this was an error.', 'warning')
    } catch (err) {
      showToast('Failed to delete transaction.', 'error')
    }
  }

  // Accounts CRUD
  const addAccount = async (acc) => {
    try {
      const newAcc = await dbService.addAccount(acc)
      setAccounts([...accounts, newAcc])
      showToast(`Account '${newAcc.name}' created!`)
    } catch (err) {
      showToast('Failed to create account.', 'error')
    }
  }

  // Categories CRUD
  const addCategory = async (cat) => {
    try {
      const newCat = await dbService.addCategory(cat)
      setCategories([...categories, newCat])
      showToast(`Category '${newCat.name}' created!`)
    } catch (err) {
      showToast('Failed to create category.', 'error')
    }
  }

  // Parties CRUD
  const addParty = async (party) => {
    try {
      const newParty = await dbService.addParty(party)
      setParties([...parties, newParty])
      showToast(`Party '${newParty.name}' added!`)
    } catch (err) {
      showToast('Failed to add party.', 'error')
    }
  }

  // Budgets CRUD
  const addBudget = async (budget) => {
    try {
      const newBudget = await dbService.addBudget(budget)
      setBudgets([...budgets, newBudget])
      showToast('Budget configured!')
    } catch (err) {
      showToast('Failed to set budget.', 'error')
    }
  }

  const updateBudget = async (id, updates) => {
    try {
      const updated = await dbService.updateBudget(id, updates)
      setBudgets(budgets.map(b => b.id === id ? updated : b))
      showToast('Budget updated!')
    } catch (err) {
      showToast('Failed to update budget.', 'error')
    }
  }

  // Goals CRUD
  const addGoal = async (goal) => {
    try {
      const newGoal = await dbService.addGoal(goal)
      setGoals([...goals, newGoal])
      showToast(`Savings Goal '${newGoal.title}' created!`)
    } catch (err) {
      showToast('Failed to add goal.', 'error')
    }
  }

  const updateGoal = async (id, updates) => {
    try {
      const updated = await dbService.updateGoal(id, updates)
      setGoals(goals.map(g => g.id === id ? updated : g))
      showToast('Savings goal updated!')
    } catch (err) {
      showToast('Failed to update goal.', 'error')
    }
  }

  // Bills CRUD
  const addBill = async (bill) => {
    try {
      const newBill = await dbService.addBill(bill)
      setBills([...bills, newBill])
      showToast(`Bill '${newBill.title}' added!`)
    } catch (err) {
      showToast('Failed to add bill.', 'error')
    }
  }

  const updateBill = async (id, updates) => {
    try {
      const updated = await dbService.updateBill(id, updates)
      setBills(bills.map(b => b.id === id ? updated : b))
      showToast('Bill updated!')
    } catch (err) {
      showToast('Failed to update bill.', 'error')
    }
  }

  // Attachments Upload
  const uploadAttachment = async (txId, file) => {
    try {
      const attach = await dbService.uploadAttachment(txId, file)
      showToast('Attachment receipt uploaded!')
      return attach
    } catch (err) {
      showToast('Receipt upload failed.', 'error')
    }
  }

  // --- RECURRING SCHEDULER & IMPORT/EXPORT BACKUPS ---
  const addRecurringTemplate = async (item) => {
    try {
      const newTemplate = await dbService.addRecurringTemplate(item)
      setRecurringTemplates(prev => [...prev, newTemplate])
      showToast(`Scheduled '${newTemplate.title}' successfully!`)
      return newTemplate
    } catch (err) {
      showToast('Failed to add schedule.', 'error')
    }
  }

  const deleteRecurringTemplate = async (id) => {
    try {
      await dbService.deleteRecurringTemplate(id)
      setRecurringTemplates(prev => prev.filter(t => t.id !== id))
      showToast('Recurring schedule deleted.', 'warning')
    } catch (err) {
      showToast('Failed to delete schedule.', 'error')
    }
  }

  const updateRecurringTemplateState = async (id, updates) => {
    try {
      const updated = await dbService.updateRecurringTemplate(id, updates)
      setRecurringTemplates(prev => prev.map(t => t.id === id ? updated : t))
      showToast('Recurring schedule updated.')
    } catch (err) {
      showToast('Failed to update schedule.', 'error')
    }
  }





  // Dynamic calculations for Financial Health & Insights
  const healthMetrics = calculateFinancialHealth({
    transactions,
    categories,
    budgets,
    goals,
    bills
  })

  const logOut = async () => {
    await dbService.signOut()
    setUser(null)
    showToast('Signed out successfully!')
    window.location.reload()
  }

  // Suggest category trigger
  const getSuggestedCategory = (note) => {
    return suggestCategory(note, categories)
  }

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        
        accounts,
        transactions,
        categories,
        parties,
        budgets,
        goals,
        bills,
        recurringTemplates,
        
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        
        toasts,
        showToast,
        removeToast,
        
        history,
        undoTransactionChange,
        redoTransactionChange,
        
        addTransaction,
        editTransaction,
        deleteTransaction,
        
        addAccount,
        addCategory,
        addParty,
        
        addBudget,
        updateBudget,
        
        addGoal,
        updateGoal,
        
        addBill,
        updateBill,

        addRecurringTemplate,
        deleteRecurringTemplate,
        updateRecurringTemplate: updateRecurringTemplateState,
        
        uploadAttachment,
        logOut,
        
        healthScore: healthMetrics.score,
        insights: healthMetrics.insights,
        getSuggestedCategory
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
