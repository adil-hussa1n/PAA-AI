import { supabase, isSupabaseConfigured } from './supabaseClient'

// Initial Seed Data with relative dates to make the dashboard look active
const getRelativeDateStr = (offsetDays) => {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().split('T')[0]
}

const getRelativeMonthStr = (offsetMonths = 0) => {
  const d = new Date()
  d.setMonth(d.getMonth() - offsetMonths)
  return d.toISOString().substring(0, 7) // 'YYYY-MM'
}

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Salary', type: 'income', color: '#10b981', icon: 'Briefcase' },
  { id: 'cat-2', name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'Laptop' },
  { id: 'cat-3', name: 'Food & Dining', type: 'expense', color: '#f59e0b', icon: 'Utensils' },
  { id: 'cat-4', name: 'Rent & Housing', type: 'expense', color: '#ef4444', icon: 'Home' },
  { id: 'cat-5', name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'Film' },
  { id: 'cat-6', name: 'Utilities', type: 'expense', color: '#06b6d4', icon: 'Zap' },
  { id: 'cat-7', name: 'Transportation', type: 'expense', color: '#6b7280', icon: 'Car' },
  { id: 'cat-8', name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'ShoppingBag' }
]

const DEFAULT_ACCOUNTS = [
  { id: 'acc-1', name: 'Chase Checking', type: 'Bank', balance: 5420.50 },
  { id: 'acc-2', name: 'Cash Wallet', type: 'Cash', balance: 450.00 },
  { id: 'acc-3', name: 'Mobile Wallet (bKash)', type: 'Mobile Wallet', balance: 125.00 }
]

const DEFAULT_PARTIES = [
  { id: 'party-1', name: 'Acme Corp', phone: '+1-555-0199', email: 'billing@acme.com', balance: 350.00 }, // positive means they owe us (take)
  { id: 'party-2', name: 'John Miller (Landlord)', phone: '+1-555-0144', email: 'john@housing.com', balance: -800.00 }, // negative means we owe them (give)
  { id: 'party-3', name: 'Sarah Connor', phone: '+1-555-0188', email: 'sarah@resistance.com', balance: 0.00 }
]

const DEFAULT_BUDGETS = [
  { id: 'bud-1', category_id: 'cat-3', limit_amount: 500.00, month: getRelativeMonthStr(0) },
  { id: 'bud-2', category_id: 'cat-6', limit_amount: 200.00, month: getRelativeMonthStr(0) },
  { id: 'bud-3', category_id: 'cat-8', limit_amount: 300.00, month: getRelativeMonthStr(0) }
]

const DEFAULT_GOALS = [
  { id: 'goal-1', title: 'Emergency Fund', target_amount: 10000.00, current_amount: 5000.00, deadline: getRelativeDateStr(-180) },
  { id: 'goal-2', title: 'New Macbook Pro', target_amount: 2500.00, current_amount: 950.00, deadline: getRelativeDateStr(-60) }
]

const DEFAULT_BILLS = [
  { id: 'bill-1', title: 'Office Rent', amount: 800.00, due_date: getRelativeDateStr(-3), status: 'paid' },
  { id: 'bill-2', title: 'Electricity Bill', amount: 120.00, due_date: getRelativeDateStr(-2), status: 'unpaid' },
  { id: 'bill-3', title: 'Cloud Hosting Subscription', amount: 45.00, due_date: getRelativeDateStr(-5), status: 'unpaid' }
]

const DEFAULT_TRANSACTIONS = [
  { id: 'tx-1', account_id: 'acc-1', to_account_id: null, type: 'income', amount: 3200.00, category_id: 'cat-1', party_id: null, note: 'Monthly Salary Paycheck', date: getRelativeDateStr(10) },
  { id: 'tx-2', account_id: 'acc-1', to_account_id: null, type: 'expense', amount: 800.00, category_id: 'cat-4', party_id: 'party-2', note: 'Rent payment', date: getRelativeDateStr(8) },
  { id: 'tx-3', account_id: 'acc-1', to_account_id: null, type: 'expense', amount: 156.40, category_id: 'cat-3', party_id: null, note: 'Grocery shopping Whole Foods', date: getRelativeDateStr(5) },
  { id: 'tx-4', account_id: 'acc-2', to_account_id: null, type: 'expense', amount: 24.50, category_id: 'cat-3', party_id: null, note: 'Dinner at Pizza House', date: getRelativeDateStr(3) },
  { id: 'tx-5', account_id: 'acc-1', to_account_id: 'acc-2', type: 'transfer', amount: 100.00, category_id: null, party_id: null, note: 'ATM cash withdrawal', date: getRelativeDateStr(2) },
  { id: 'tx-6', account_id: 'acc-1', to_account_id: null, type: 'income', amount: 450.00, category_id: 'cat-2', party_id: 'party-1', note: 'Freelance UI design milestone', date: getRelativeDateStr(1) },
  { id: 'tx-7', account_id: 'acc-3', to_account_id: null, type: 'expense', amount: 12.00, category_id: 'cat-5', party_id: null, note: 'Netflix Subscription', date: getRelativeDateStr(0) }
]

const DEFAULT_RECURRING_TEMPLATES = [
  { id: 'rec-1', title: 'Spotify Premium', amount: 15.99, account_id: 'acc-1', type: 'expense', category_id: 'cat-5', frequency: 'monthly', start_date: getRelativeDateStr(30), next_run_date: getRelativeDateStr(0), active: true },
  { id: 'rec-2', title: 'Gym Membership', amount: 45.00, account_id: 'acc-1', type: 'expense', category_id: 'cat-8', frequency: 'monthly', start_date: getRelativeDateStr(15), next_run_date: getRelativeDateStr(15), active: true }
]

const loadLocalStorageData = () => {
  const initKey = (key, defaultValue) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultValue))
    }
  }
  initKey('paa_categories', DEFAULT_CATEGORIES)
  initKey('paa_accounts', DEFAULT_ACCOUNTS)
  initKey('paa_parties', DEFAULT_PARTIES)
  initKey('paa_budgets', DEFAULT_BUDGETS)
  initKey('paa_goals', DEFAULT_GOALS)
  initKey('paa_bills', DEFAULT_BILLS)
  initKey('paa_transactions', DEFAULT_TRANSACTIONS)
  initKey('paa_recurring_templates', DEFAULT_RECURRING_TEMPLATES)
  initKey('paa_attachments', [])
  initKey('paa_sync_queue', [])
}

// Ensure local storage is seeded
if (typeof window !== 'undefined') {
  loadLocalStorageData()
}

const getLocal = (key) => {
  try {
    const val = localStorage.getItem(key)
    if (!val) return []
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error(`Error reading local storage key ${key}:`, e)
    return []
  }
}
const setLocal = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(data) ? data : []))
  } catch (e) {
    console.error(`Error writing local storage key ${key}:`, e)
  }
}

// Helper to recalculate all account balances from transactions offline
const recalculateBalances = () => {
  const txs = getLocal('paa_transactions')
  const accounts = getLocal('paa_accounts')
  const parties = getLocal('paa_parties')

  // Reset accounts to baseline
  const baseAccounts = DEFAULT_ACCOUNTS.map(a => ({ ...a, balance: 0.0 }))
  const accMap = {}
  accounts.forEach(acc => {
    accMap[acc.id] = { ...acc, balance: 0.0 }
  })

  // Reset parties to baseline
  const partyMap = {}
  parties.forEach(p => {
    partyMap[p.id] = { ...p, balance: 0.0 }
  })

  // Apply transactions
  txs.forEach(tx => {
    const amt = parseFloat(tx.amount)
    if (tx.type === 'income') {
      if (accMap[tx.account_id]) accMap[tx.account_id].balance += amt
      if (tx.party_id && partyMap[tx.party_id]) {
        partyMap[tx.party_id].balance -= amt // party paid us, they owe us less
      }
    } else if (tx.type === 'expense') {
      if (accMap[tx.account_id]) accMap[tx.account_id].balance -= amt
      if (tx.party_id && partyMap[tx.party_id]) {
        partyMap[tx.party_id].balance += amt // we paid party, they owe us more / we owe them less
      }
    } else if (tx.type === 'transfer') {
      if (accMap[tx.account_id]) accMap[tx.account_id].balance -= amt
      if (tx.to_account_id && accMap[tx.to_account_id]) accMap[tx.to_account_id].balance += amt
    }
  })

  setLocal('paa_accounts', Object.values(accMap))
  setLocal('paa_parties', Object.values(partyMap))
}

// API SERVICE WRAPPER
export const dbService = {
  // --- AUTH ---
  async getSession() {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!error && data.session) return data.session
      } catch (err) {
        console.warn('Supabase getSession failed, falling back to local auth:', err)
      }
    }
    const localUser = localStorage.getItem('paa_user')
    return localUser ? JSON.parse(localUser) : null
  },

  async signUp(email, password) {
    // Bypassing Supabase Auth signUp to avoid email verification rate limits for now
    const user = { user: { id: 'mock-user-id', email }, session: { access_token: 'mock-token' } }
    localStorage.setItem('paa_user', JSON.stringify(user))
    return { data: user, error: null }
  },

  async signIn(email, password) {
    // Bypassing Supabase Auth signIn to avoid email verification rate limits for now
    if (email && password) {
      const user = { user: { id: 'mock-user-id', email }, session: { access_token: 'mock-token' } }
      localStorage.setItem('paa_user', JSON.stringify(user))
      return { data: user, error: null }
    }
    return { data: null, error: new Error('Invalid email or password') }
  },

  async signOut() {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.warn('Supabase signOut failed, falling back to local auth:', err)
      }
    }
    localStorage.removeItem('paa_user')
    return { error: null }
  },

  // --- GENERIC CRUD ---
  async getItems(table) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
        if (!error && data) return data
        if (error) {
          console.warn(`Supabase getItems error for ${table}:`, error.message)
        }
      } catch (err) {
        console.warn(`Supabase getItems failed for ${table}, falling back to local:`, err)
      }
    }
    return getLocal(`paa_${table}`)
  },

  async addItem(table, item) {
    const newItem = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...item }
    if (isSupabaseConfigured()) {
      try {
        const sessionRes = await supabase.auth.getSession()
        const userId = sessionRes?.data?.session?.user?.id
        const itemToInsert = userId ? { ...item, user_id: userId } : { ...item }

        const { data, error } = await supabase.from(table).insert([itemToInsert]).select()
        if (!error && data && data[0]) return data[0]
        if (error) {
          console.warn(`Supabase addItem error for ${table}:`, error.message)
        }
      } catch (err) {
        console.warn(`Supabase addItem failed for ${table}, falling back to local:`, err)
      }
    }
    const current = getLocal(`paa_${table}`)
    setLocal(`paa_${table}`, [...current, newItem])
    if (table === 'transactions') recalculateBalances()
    return newItem
  },

  async updateItem(table, id, updates) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from(table).update(updates).eq('id', id).select()
        if (!error && data && data[0]) return data[0]
        if (error) {
          console.warn(`Supabase updateItem error for ${table}:`, error.message)
        }
      } catch (err) {
        console.warn(`Supabase updateItem failed for ${table}, falling back to local:`, err)
      }
    }
    const current = getLocal(`paa_${table}`)
    const updated = current.map(item => item.id === id ? { ...item, ...updates } : item)
    setLocal(`paa_${table}`, updated)
    if (table === 'transactions' || table === 'accounts' || table === 'parties') recalculateBalances()
    return updated.find(item => item.id === id)
  },

  async deleteItem(table, id) {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from(table).delete().eq('id', id)
        if (!error) return true
        if (error) {
          console.warn(`Supabase deleteItem error for ${table}:`, error.message)
        }
      } catch (err) {
        console.warn(`Supabase deleteItem failed for ${table}, falling back to local:`, err)
      }
    }
    const current = getLocal(`paa_${table}`)
    setLocal(`paa_${table}`, current.filter(item => item.id !== id))
    if (table === 'transactions') recalculateBalances()
    return true
  },

  // --- CUSTOM TRANSACTIONS ---
  async getTransactions() {
    return this.getItems('transactions')
  },

  async addTransaction(tx) {
    return this.addItem('transactions', tx)
  },

  async updateTransaction(id, updates) {
    return this.updateItem('transactions', id, updates)
  },

  async deleteTransaction(id) {
    return this.deleteItem('transactions', id)
  },

  // --- ACCOUNTS ---
  async getAccounts() {
    return this.getItems('accounts')
  },

  async addAccount(acc) {
    return this.addItem('accounts', acc)
  },

  // --- CATEGORIES ---
  async getCategories() {
    return this.getItems('categories')
  },

  async addCategory(cat) {
    return this.addItem('categories', cat)
  },

  // --- PARTIES ---
  async getParties() {
    return this.getItems('parties')
  },

  async addParty(party) {
    return this.addItem('parties', party)
  },

  // --- BUDGETS ---
  async getBudgets() {
    return this.getItems('budgets')
  },

  async addBudget(budget) {
    return this.addItem('budgets', budget)
  },

  async updateBudget(id, updates) {
    return this.updateItem('budgets', id, updates)
  },

  // --- GOALS ---
  async getGoals() {
    return this.getItems('goals')
  },

  async updateGoal(id, updates) {
    return this.updateItem('goals', id, updates)
  },

  async addGoal(goal) {
    return this.addItem('goals', goal)
  },

  // --- BILLS ---
  async getBills() {
    return this.getItems('bills')
  },

  async updateBill(id, updates) {
    return this.updateItem('bills', id, updates)
  },

  async addBill(bill) {
    return this.addItem('bills', bill)
  },

  // --- ATTACHMENTS (SUPABASE STORAGE fallback to DataURLs) ---
  async getAttachments(txId) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attachments')
          .select('*')
          .eq('transaction_id', txId)
        if (!error && data) return data
        if (error) {
          console.warn('Supabase getAttachments error:', error.message)
        }
      } catch (err) {
        console.warn('Supabase getAttachments failed, falling back to local:', err)
      }
    }
    const list = getLocal('paa_attachments')
    return list.filter(a => a.transaction_id === txId)
  },

  async uploadAttachment(txId, file) {
    const fileName = file.name
    let fileUrl = ''

    if (isSupabaseConfigured()) {
      try {
        const fileExt = fileName.split('.').pop()
        const filePath = `${txId}/${crypto.randomUUID()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file)
        
        if (!uploadError) {
          const { data } = supabase.storage.from('receipts').getPublicUrl(filePath)
          fileUrl = data.publicUrl

          // Insert metadata row into Supabase attachments table
          const sessionRes = await supabase.auth.getSession()
          const userId = sessionRes?.data?.session?.user?.id

          if (userId) {
            const dbInsert = {
              transaction_id: txId,
              file_url: fileUrl,
              file_name: fileName,
              user_id: userId
            }
            const { data: dbData, error: dbError } = await supabase
              .from('attachments')
              .insert([dbInsert])
              .select()

            if (!dbError && dbData && dbData[0]) {
              // Update local cache and return
              const current = getLocal('paa_attachments')
              setLocal('paa_attachments', [...current, dbData[0]])
              return dbData[0]
            } else if (dbError) {
              console.warn('Supabase insert attachment metadata error:', dbError.message)
            }
          }
        } else {
          console.warn('Supabase storage upload error:', uploadError.message)
        }
      } catch (err) {
        console.warn('Supabase uploadAttachment failed, falling back to local:', err)
      }
    }

    if (!fileUrl) {
      // Offline fallback: Convert file to Base64 dataURL
      fileUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
    }

    const attachItem = {
      id: crypto.randomUUID(),
      transaction_id: txId,
      file_url: fileUrl,
      file_name: fileName,
      created_at: new Date().toISOString()
    }

    const current = getLocal('paa_attachments')
    setLocal('paa_attachments', [...current, attachItem])
    return attachItem
  },

  // --- RECURRING TEMPLATES ---
  async getRecurringTemplates() {
    return this.getItems('recurring_templates')
  },

  async addRecurringTemplate(item) {
    return this.addItem('recurring_templates', item)
  },

  async updateRecurringTemplate(id, updates) {
    return this.updateItem('recurring_templates', id, updates)
  },

  async deleteRecurringTemplate(id) {
    return this.deleteItem('recurring_templates', id)
  }
}
