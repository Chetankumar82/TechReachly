import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Premium in-app Delete Confirmation Alert Box
 * Portaled to document.body with z-[9999] to ensure it always displays
 * in front of all pages, docks, and footers.
 */
export const DeleteAlertModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  description = 'Are you sure you want to delete this? This action cannot be undone and will permanently remove the data.',
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
  isDeleting = false,
  dangerIcon = 'trash', // 'trash' | 'alert'
}) => {
  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling while modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 dark:bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        className="saas-card max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative border-rose-500/30 dark:border-rose-500/40 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white transition-colors p-1 rounded-md cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Danger Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5">
            {dangerIcon === 'alert' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1 pr-6">
            <h3 id="alert-dialog-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Highlighted Target Item Banner (if provided) */}
        {itemName && (
          <div className="p-3 rounded-lg bg-rose-500/[0.06] dark:bg-rose-500/[0.1] border border-rose-500/20 text-xs flex items-center gap-2 text-rose-900 dark:text-rose-200 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-ping"></span>
            <span className="truncate">{itemName}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onConfirm) onConfirm();
            }}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 shadow-sm transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default DeleteAlertModal;
