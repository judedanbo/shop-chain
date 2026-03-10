import React, { useState, useEffect } from 'react';
import { useToast, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isSmall } from '@/utils/responsive';
import { ToastNotification, PlanUsageBanner } from '@/components/features';
import { LimitBlockedModal, UpgradeModal } from '@/components/modals';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const bp = useBreakpoint();
  const { page } = useNavigation();
  const { toasts, removeToast } = useToast();

  // UI state (moved from App.tsx)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const mobile = isSmall(bp);

  useEffect(() => {
    if (mobile) setMobileMenuOpen(false);
  }, [page, mobile]);

  return (
    <div className="bg-bg text-text flex h-screen overflow-hidden font-[DM_Sans,Segoe_UI,sans-serif]">
      {/* Mobile overlay backdrop */}
      {mobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
          className="z-mobile-overlay fixed inset-0 bg-black/50 backdrop-blur-[2px]"
        />
      )}

      <Sidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex w-0 flex-1 flex-col overflow-hidden">
        <Header
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          roleSwitcherOpen={roleSwitcherOpen}
          setRoleSwitcherOpen={setRoleSwitcherOpen}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Page content */}
        <div className="flex-1 overflow-auto p-3 pb-[72px] sm:p-4 md:p-5 lg:p-6">
          <PlanUsageBanner />
          {children}
        </div>

        <LimitBlockedModal />
        <UpgradeModal />

        <MobileNav onOpenMenu={() => setMobileMenuOpen(true)} />
      </div>

      {/* Toast notifications */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
