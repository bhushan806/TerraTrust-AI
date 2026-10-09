import React, { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  badge,
  children,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-5 ${className}`}>
      <div className="border-b border-neutral-100 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-900">{title}</h3>
            {badge}
          </div>
          {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
};
