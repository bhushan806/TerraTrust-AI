import React, { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
  action,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-[#FEFCE8]',
          border: 'border-[#FDE047]',
          text: 'text-[#854D0E]',
          titleText: 'text-[#713F12]',
          icon: <AlertTriangle className="w-5 h-5 text-[#CA8A04] shrink-0 mt-0.5" aria-hidden="true" />,
        };
      case 'error':
        return {
          bg: 'bg-[#FEF2F2]',
          border: 'border-[#FECACA]',
          text: 'text-[#991B1B]',
          titleText: 'text-[#7F1D1D]',
          icon: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />,
        };
      case 'success':
        return {
          bg: 'bg-[#F0FDF4]',
          border: 'border-[#BBF7D0]',
          text: 'text-[#166534]',
          titleText: 'text-[#14532D]',
          icon: <CheckCircle className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" aria-hidden="true" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-[#EFF6FF]',
          border: 'border-[#BFDBFE]',
          text: 'text-[#1E40AF]',
          titleText: 'text-[#1E3A8A]',
          icon: <Info className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`rounded-lg border p-4 ${styles.bg} ${styles.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        {styles.icon}
        <div className="flex-1 text-sm">
          {title && <h3 className={`font-semibold mb-1 ${styles.titleText}`}>{title}</h3>}
          <div className={styles.text}>{children}</div>
          {action && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={action.onClick}
                className="font-semibold underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="text-neutral-400 hover:text-neutral-600 p-1 -mr-1 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
