import React, { ReactNode } from 'react';

interface DetailCardProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const DetailCard: React.FC<DetailCardProps> = ({
  title,
  subtitle,
  badge,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};
