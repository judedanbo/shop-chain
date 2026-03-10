import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="bg-bg relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient background blobs */}
      <div className="bg-primary/[0.03] pointer-events-none absolute -top-[120px] -right-[120px] h-[300px] w-[300px] rounded-full blur-[80px]" />
      <div className="bg-accent/[0.03] pointer-events-none absolute -bottom-[100px] -left-[80px] h-[250px] w-[250px] rounded-full blur-[80px]" />

      <div className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 sm:py-10">
        <div className="sm:border-border sm:bg-surface w-full max-w-[420px] rounded-none bg-transparent p-0 shadow-none sm:rounded-[20px] sm:border sm:px-8 sm:py-9 sm:shadow-[0_8px_40px_rgba(0,0,0,0.15)]">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="text-text-dim px-5 py-4 text-center text-[11px]">
        &copy; 2026 ShopChain &middot; <span className="text-text-muted cursor-pointer">Terms</span> &middot;{' '}
        <span className="text-text-muted cursor-pointer">Privacy</span> &middot;{' '}
        <span className="text-text-muted cursor-pointer">Help</span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
