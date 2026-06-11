# Centava - Premium Personal Finance & Accounting

Centava is a complete, production-ready personal accounting web application featuring real-time tracking of wallets, custom category budgets, debt management with contacts, savings goals, due bills, calendar logs, and smart AI category suggestions.

Built using **React (Vite)**, **Tailwind CSS**, and **Supabase Backend**.

---

## 💎 Features

- **Dashboard**: Net balance aggregation, recent cash flow graphs (Line), category distributions (Doughnut), daily comparisons (Bar), and a financial health index.
- **Transactions**: Add, edit, delete, and search entries with interactive **Undo/Redo** capabilities.
- **Accounts System**: Track physical cash, bank cards, checkings, and mobile wallets. Supports internal funds transfer.
- **Parties & Debts**: Keep track of people/businesses, watch give/take balances, and inspect custom statements.
- **Budgets & Goals**: Set limits on category spending. Track savings progress and add quick funds.
- **Due Bills**: Never miss utility, rent, or subscription invoices. Toggle clear status.
- **Calendar view**: Inspect income/outflow sums in a date grid.
- **AI Suggester**: Analyzes notes to auto-suggest categories.
- **Offline-First**: Runs fully in-browser using `localStorage` seeds immediately without a backend; automatically syncs with Supabase once credentials are provided!

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally (Offline fallback active)
```bash
npm run dev
```
Centava will automatically initialize local storage with mock seed data, letting you experiment immediately with no database setup required.

### 3. Connect Supabase (Optional)
To back up your data to the cloud:
1. Create a project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** in Supabase and paste the contents of [supabase/schema.sql](file:///f:/GITHUB/PAA%20AI/supabase/schema.sql) to set up tables, RLS rules, and automatic triggers.
3. Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
4. Restart the development server. The application will connect directly to your database.
