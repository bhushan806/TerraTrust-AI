import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './providers';
import { AppFeature, hasPermission } from '@/lib/auth/permissions';
import { PermissionDenied } from '@/components/feedback/PermissionDenied';

interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center text-sm font-medium text-neutral-600">
          Verifying institutional credentials...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface RequirePermissionProps {
  feature: AppFeature;
  children: ReactNode;
  fallbackMessage?: string;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  feature,
  children,
  fallbackMessage,
}) => {
  const { user } = useAuth();

  if (!user || !hasPermission(user.role, feature)) {
    return (
      <PermissionDenied
        requiredRole={user?.role}
        scopeMessage={
          fallbackMessage ||
          `This operational route requires authorized clearance (${feature}) which is not granted to the ${user?.role || 'current'} role.`
        }
      />
    );
  }

  return <>{children}</>;
};

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
