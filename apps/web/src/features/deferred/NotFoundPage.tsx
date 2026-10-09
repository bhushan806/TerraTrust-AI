import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Home } from 'lucide-react';

/**
 * NotFoundPage — 404 handler shown when an authenticated user navigates to an unknown route.
 * Provides clear navigation back to safe locations.
 */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center" role="main">
      <div className="max-w-md w-full space-y-6">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mx-auto"
          aria-hidden="true"
        >
          <MapPin className="w-8 h-8 text-neutral-500" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <p className="text-xs font-bold tracking-widest text-neutral-400 uppercase">
            404 — Page Not Found
          </p>
          <h1 className="text-2xl font-bold text-neutral-900">
            This page could not be found
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            The page you are looking for does not exist, may have been moved, or you may
            not have permission to view it. Check the URL or navigate to a known section.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go Back
          </button>
          <Link to="/" className="btn btn-primary">
            <Home className="w-4 h-4" aria-hidden="true" />
            Return to Dashboard
          </Link>
        </div>

        {/* Helpful links */}
        <div className="pt-2 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 mb-3">Or navigate to:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/borrowers" className="text-xs text-primary-700 hover:underline font-medium">
              Borrowers
            </Link>
            <span className="text-neutral-300" aria-hidden="true">·</span>
            <Link to="/assessments/new" className="text-xs text-primary-700 hover:underline font-medium">
              New Assessment
            </Link>
            <span className="text-neutral-300" aria-hidden="true">·</span>
            <Link to="/admin/data-sources" className="text-xs text-primary-700 hover:underline font-medium">
              Data Sources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
