import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PermissionDeniedProps {
  requiredRole?: string;
  scopeMessage?: string;
  className?: string;
}

export const PermissionDenied: React.FC<PermissionDeniedProps> = ({
  requiredRole,
  scopeMessage,
  className = '',
}) => {
  const navigate = useNavigate();

  return (
    <div
      role="alert"
      className={`rounded-xl border border-neutral-200 bg-white p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8 shadow-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-5">
        <ShieldAlert className="w-7 h-7" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-bold text-neutral-900 mb-2">Institutional Access Restricted</h2>
      <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
        {scopeMessage ||
          'You do not possess the authorized role or branch assignment required to access this resource.'}
      </p>

      {requiredRole && (
        <div className="mb-6 px-3 py-1.5 bg-neutral-100 rounded text-xs text-neutral-700">
          Required Authorized Scope: <span className="font-semibold text-neutral-900">{requiredRole}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Previous Page
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};
