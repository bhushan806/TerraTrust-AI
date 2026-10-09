import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { UserRole } from '@/types/domain';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  isOpen,
  onClose,
  currentRole,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      className="fixed inset-0 z-50 lg:hidden flex"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mobile navigation"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Sidebar currentRole={currentRole} onNavigate={onClose} className="w-full border-r-0" />
      </div>
    </div>
  );
};
