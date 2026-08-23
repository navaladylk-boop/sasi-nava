import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../i18n/translations';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, label, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${className}`}
      title="Go back to previous page"
    >
      <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
      <span>{label || 'Back'}</span>
    </button>
  );
};

interface CloseButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const CloseButton: React.FC<CloseButtonProps> = ({ onClick, label, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${className}`}
      title="Close current page or modal"
    >
      <X className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
      <span>{label || 'Close'}</span>
    </button>
  );
};

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onDiscard: () => void;
  onCancel: () => void;
  language?: Language;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onDiscard,
  onCancel,
  language = 'en'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg shrink-0">
            !
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Unsaved Changes</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Unsaved changes will be lost. Do you want to close?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
};
