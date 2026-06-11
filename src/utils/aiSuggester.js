// src/utils/aiSuggester.js

const KEYWORD_MAP = {
  // Income keywords
  salary: 'Salary',
  paycheck: 'Salary',
  wage: 'Salary',
  dividend: 'Salary',
  freelance: 'Freelance',
  upwork: 'Freelance',
  fiverr: 'Freelance',
  contract: 'Freelance',
  consulting: 'Freelance',

  // Expense keywords
  uber: 'Transportation',
  lyft: 'Transportation',
  taxi: 'Transportation',
  bus: 'Transportation',
  train: 'Transportation',
  metro: 'Transportation',
  gas: 'Transportation',
  fuel: 'Transportation',
  petrol: 'Transportation',

  pizza: 'Food & Dining',
  burger: 'Food & Dining',
  restaurant: 'Food & Dining',
  cafe: 'Food & Dining',
  coffee: 'Food & Dining',
  starbucks: 'Food & Dining',
  food: 'Food & Dining',
  grocery: 'Food & Dining',
  supermarket: 'Food & Dining',
  walmart: 'Food & Dining',
  kroger: 'Food & Dining',

  rent: 'Rent & Housing',
  apartment: 'Rent & Housing',
  landlord: 'Rent & Housing',
  mortgage: 'Rent & Housing',

  netflix: 'Entertainment',
  spotify: 'Entertainment',
  youtube: 'Entertainment',
  steam: 'Entertainment',
  game: 'Entertainment',
  movie: 'Entertainment',
  cinema: 'Entertainment',
  concert: 'Entertainment',

  electricity: 'Utilities',
  power: 'Utilities',
  water: 'Utilities',
  gas_bill: 'Utilities',
  internet: 'Utilities',
  wifi: 'Utilities',
  broadband: 'Utilities',
  phone: 'Utilities',
  mobile: 'Utilities',

  amazon: 'Shopping',
  ebay: 'Shopping',
  target: 'Shopping',
  clothes: 'Shopping',
  shoes: 'Shopping',
  electronics: 'Shopping'
}

/**
 * Suggests a category name based on a text note or description.
 * @param {string} note - The transaction note or payee name.
 * @param {Array} categories - List of available categories.
 * @returns {Object|null} The suggested category object, or null.
 */
export const suggestCategory = (note, categories) => {
  if (!note || !categories || categories.length === 0) return null

  const normalized = note.toLowerCase()
  
  // Find a matching keyword
  for (const [keyword, categoryName] of Object.entries(KEYWORD_MAP)) {
    if (normalized.includes(keyword)) {
      // Find category in the user's categories
      const match = categories.find(
        cat => cat.name.toLowerCase() === categoryName.toLowerCase()
      )
      if (match) return match
    }
  }

  // Fallback: search user's category names directly in the note
  for (const cat of categories) {
    if (normalized.includes(cat.name.toLowerCase())) {
      return cat
    }
  }

  return null
}
