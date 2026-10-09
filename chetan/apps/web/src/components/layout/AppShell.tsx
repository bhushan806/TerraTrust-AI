import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNavigation } from './MobileNavigation';
import { useAuth } from '@/app/providers';
import { useScope } from '@/app/providers';

import { WorkflowPipelineBar } from './WorkflowPipelineBar';

export const AppShell: React.FC = () => {
  const { user, logout, switchRoleForDemo } = useAuth();
  const scope = useScope();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Keyboard Accessibility Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-900 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700 text-xs font-bold"
      >
        Skip directly to main page content
      </a>

      {/* Topbar */}
      {user && (
        <Topbar
          user={{
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          scope={scope}
          onLogout={logout}
          onSwitchRole={switchRoleForDemo}
          onToggleMobileNav={() => setMobileNavOpen(true)}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {user && (
          <div className="hidden lg:block shrink-0 h-[calc(100vh-4rem)] sticky top-16">
            <Sidebar currentRole={user.role} />
          </div>
        )}

        {/* Mobile Slide-over Drawer */}
        {user && (
          <MobileNavigation
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            currentRole={user.role}
          />
        )}

        {/* Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full focus:outline-none"
        >
          {/* Interactive Agricultural Credit Decision Pipeline Flow */}
          <WorkflowPipelineBar />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
