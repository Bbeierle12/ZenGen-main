import React from 'react';
import { useNav } from '../../contexts/NavContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { PageRouter } from './PageRouter';
import { UserStats } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
  stats: UserStats | null;
  onOpenProfile: () => void;
}

/**
 * Main layout component that provides:
 * - Sidebar navigation (desktop)
 * - Bottom navigation (mobile)
 * - Top bar with profile access
 * - Content area with proper offsets
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, stats, onOpenProfile }) => {
  const { state } = useNav();
  const { sidebarExpanded, isMobile } = state;

  // Calculate content margin based on sidebar state (desktop only)
  const contentMarginLeft = isMobile ? '0' : sidebarExpanded ? '15rem' : '4rem';

  return (
    <>
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-teal-900/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Navigation */}
      {!isMobile && <Sidebar />}
      {isMobile && <BottomNav />}

      {/* Top Bar */}
      <TopBar stats={stats} onOpenProfile={onOpenProfile} />

      {/* Main Content Area */}
      <main
        className="relative z-10 min-h-screen bg-slate-950 text-slate-200 transition-all duration-300"
        style={{ marginLeft: contentMarginLeft }}
      >
        <div className={`pt-16 ${isMobile ? 'pb-20' : 'pb-8'}`}>
          <PageRouter>
            {children}
          </PageRouter>
        </div>
      </main>
    </>
  );
};
