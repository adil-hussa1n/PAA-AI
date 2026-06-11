import React from 'react'
import { useApp } from '../context/AppContext'
import { X, CheckCircle, AlertTriangle, AlertCircle, RotateCcw } from 'lucide-react'

export const ToastContainer = () => {
  const { toasts, removeToast, undoTransactionChange, history } = useApp()

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isWarning = toast.type === 'warning'
        const isError = toast.type === 'error'
        const isInfo = toast.type === 'info'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 rounded-xl border shadow-xl animate-scale-in glass-effect duration-300 ${
              isSuccess ? 'border-emerald-500/30 text-slate-800 dark:text-slate-100' :
              isWarning ? 'border-amber-500/30 text-slate-800 dark:text-slate-100' :
              isError ? 'border-rose-500/30 text-slate-800 dark:text-slate-100' :
              'border-blue-500/30 text-slate-800 dark:text-slate-100'
            }`}
          >
            {/* Status Icons */}
            <div className="mr-3 mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle className="h-5 w-5 text-emerald-500" />}
              {isWarning && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {isError && <AlertCircle className="h-5 w-5 text-rose-500" />}
              {isInfo && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>

            {/* Message Body */}
            <div className="flex-grow">
              <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
              
              {/* Show undo button specifically for warning messages (like deletions) or if requested */}
              {isWarning && history.past.length > 0 && (
                <button
                  onClick={() => {
                    undoTransactionChange()
                    removeToast(toast.id)
                  }}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 dark:text-primary-100 dark:hover:text-white bg-primary-500/10 hover:bg-primary-500/20 px-2.5 py-1 rounded-md transition duration-150 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Undo Action
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition duration-150 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
