import React, { ReactNode } from 'react';
import { Inbox, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-neutral-200 rounded-xl bg-white ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 mb-4">
        {icon || <Inbox className="w-6 h-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-600 max-w-md mb-6">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white text-sm font-medium rounded-lg hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 transition-colors shadow-sm"
        >
          {action.icon || <Plus className="w-4 h-4" aria-hidden="true" />}
          {action.label}
        </button>
      )}
    </div>
  );
};
