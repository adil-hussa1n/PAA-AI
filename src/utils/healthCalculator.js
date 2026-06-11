// src/utils/healthCalculator.js

/**
 * Calculates a financial health score from 0 to 100 and yields personalized insights.
 */
export const calculateFinancialHealth = ({
  transactions,
  categories,
  budgets,
  goals,
  bills
}) => {
  let score = 50 // baseline
  const insights = []

  // 1. Savings Rate Calculation (Max 30 points)
  const currentMonth = new Date().toISOString().substring(0, 7)
  const currentMonthTx = transactions.filter(t => t.date.substring(0, 7) === currentMonth)
  
  const income = currentMonthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    
  const expenses = currentMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)

  let savingsRate = 0
  if (income > 0) {
    savingsRate = ((income - expenses) / income) * 100
  }

  let savingsScore = 0
  if (income === 0 && expenses > 0) {
    savingsScore = 0
    insights.push({
      type: 'warning',
      category: 'savings',
      message: 'No income logged for this month yet. Ensure all revenue sources are tracked.'
    })
  } else if (savingsRate < 0) {
    savingsScore = 5
    insights.push({
      type: 'danger',
      category: 'savings',
      message: `You are spending more than you earn! Current savings rate is ${savingsRate.toFixed(1)}%.`
    })
  } else {
    // 0% savings rate = 10 pts, 20% = 25 pts, 40%+ = 30 pts
    savingsScore = Math.min(30, Math.max(10, Math.round(10 + (savingsRate * 0.5))))
    if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        category: 'savings',
        message: `Excellent! Your savings rate of ${savingsRate.toFixed(1)}% exceeds the healthy 20% threshold.`
      })
    } else {
      insights.push({
        type: 'info',
        category: 'savings',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim to save at least 20% of your income.`
      })
    }
  }

  // 2. Budget Adherence (Max 30 points)
  let budgetScore = 30
  let exceededCount = 0
  let activeBudgets = 0

  budgets.forEach(b => {
    if (b.month === currentMonth) {
      activeBudgets++
      // calculate spending in this budget's category
      const categoryTx = currentMonthTx.filter(t => t.category_id === b.category_id && t.type === 'expense')
      const spent = categoryTx.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      if (spent > parseFloat(b.limit_amount)) {
        exceededCount++
        const cat = categories.find(c => c.id === b.category_id)
        insights.push({
          type: 'danger',
          category: 'budget',
          message: `Budget exceeded for '${cat ? cat.name : 'Unknown'}'. Spent $${spent.toFixed(2)} of $${parseFloat(b.limit_amount).toFixed(2)}.`
        })
      } else if (spent > parseFloat(b.limit_amount) * 0.8) {
        const cat = categories.find(c => c.id === b.category_id)
        insights.push({
          type: 'warning',
          category: 'budget',
          message: `'${cat ? cat.name : 'Unknown'}' budget is at ${(spent / parseFloat(b.limit_amount) * 100).toFixed(0)}%. Slow down spending here.`
        })
      }
    }
  })

  if (activeBudgets > 0) {
    const exceededRatio = exceededCount / activeBudgets
    budgetScore = Math.round(30 * (1 - exceededRatio))
  } else {
    budgetScore = 20 // neutral
    insights.push({
      type: 'info',
      category: 'budget',
      message: 'Create monthly category budgets to keep spending structured and improve your score.'
    })
  }

  // 3. Unpaid Bills (Max 20 points)
  let billScore = 20
  const unpaidBills = bills.filter(b => b.status === 'unpaid')
  const overdueBills = unpaidBills.filter(b => new Date(b.due_date) < new Date())
  
  if (overdueBills.length > 0) {
    billScore = 5
    insights.push({
      type: 'danger',
      category: 'bills',
      message: `You have ${overdueBills.length} overdue bill(s)! Pay them immediately to avoid penalties.`
    })
  } else if (unpaidBills.length > 0) {
    billScore = 15
    insights.push({
      type: 'warning',
      category: 'bills',
      message: `You have ${unpaidBills.length} upcoming bill(s) due soon. Keep funds ready.`
    })
  } else {
    insights.push({
      type: 'success',
      category: 'bills',
      message: 'All bills are up to date! Great job on timely payments.'
    })
  }

  // 4. Savings Goals Progress (Max 20 points)
  let goalScore = 10
  if (goals.length > 0) {
    const totalTarget = goals.reduce((sum, g) => sum + parseFloat(g.target_amount), 0)
    const totalCurrent = goals.reduce((sum, g) => sum + parseFloat(g.current_amount), 0)
    const ratio = totalTarget > 0 ? totalCurrent / totalTarget : 0
    goalScore = Math.round(20 * ratio)

    // Find closest goal
    const activeGoals = goals.filter(g => parseFloat(g.current_amount) < parseFloat(g.target_amount))
    if (activeGoals.length > 0) {
      const g = activeGoals[0]
      const pct = (parseFloat(g.current_amount) / parseFloat(g.target_amount) * 100).toFixed(0)
      insights.push({
        type: 'info',
        category: 'goals',
        message: `Goal '${g.title}' is ${pct}% funded. Put some spare cash toward it today!`
      })
    }
  } else {
    insights.push({
      type: 'info',
      category: 'goals',
      message: 'Setting savings goals keeps you motivated. Try setting a new one!'
    })
  }

  // Final Score
  score = savingsScore + budgetScore + billScore + goalScore

  return {
    score: Math.max(0, Math.min(100, score)),
    insights
  }
}
