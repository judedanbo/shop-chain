import React from 'react';
import { Shield, Mail, Lock } from 'lucide-react';
import { useColors } from '@/context';
interface AdminLoginScreenProps {
  setAuthScreen: (screen: string) => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ setAuthScreen }) => {
  const COLORS = useColors();

  return (
    <div className="bg-bg flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-[400px]" style={{ animation: 'modalIn 0.3s ease' }}>
        <div className="mb-7 text-center">
          <div
            className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `linear-gradient(135deg, ${COLORS.danger}, #FF6B6B)` }}
          >
            <Shield size={28} className="text-white" />
          </div>
          <div className="text-text text-[22px] font-extrabold">Admin Portal</div>
          <div className="text-text-dim text-xs">ShopChain Platform Administration</div>
        </div>
        <div className="bg-surface rounded-[18px] p-6" style={{ border: `1.5px solid ${COLORS.border}` }}>
          <div className="mb-4">
            <label className="text-text-muted mb-[5px] block text-[11px] font-bold tracking-[0.5px] uppercase">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={14} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                defaultValue="admin@shopchain.com"
                className="bg-surface-alt text-text w-full rounded-[10px] py-[11px] pr-3.5 pl-9 font-[inherit] text-[13px] outline-none"
                style={{
                  border: `1.5px solid ${COLORS.border}`,
                }}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-text-muted mb-[5px] block text-[11px] font-bold tracking-[0.5px] uppercase">
              Password
            </label>
            <div className="relative">
              <Lock size={14} className="text-text-dim absolute top-1/2 left-3 -translate-y-1/2" />
              <input
                type="password"
                defaultValue="admin123"
                className="bg-surface-alt text-text w-full rounded-[10px] py-[11px] pr-3.5 pl-9 font-[inherit] text-[13px] outline-none"
                style={{
                  border: `1.5px solid ${COLORS.border}`,
                }}
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="text-text-muted mb-[5px] block text-[11px] font-bold tracking-[0.5px] uppercase">
              2FA Code
            </label>
            <div className="flex gap-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <input
                  key={i}
                  maxLength={1}
                  defaultValue={String(i + 1)}
                  className="bg-surface-alt text-text h-11 w-10 rounded-lg text-center font-mono text-lg font-bold outline-none"
                  style={{
                    border: `1.5px solid ${COLORS.border}`,
                  }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAuthScreen('adminDashboard')}
            className="w-full rounded-xl border-none px-5 py-[13px] font-[inherit] text-sm font-extrabold text-white"
            style={{
              background: `linear-gradient(135deg, ${COLORS.danger}, #FF6B6B)`,
              boxShadow: `0 6px 24px ${COLORS.danger}30`,
            }}
          >
            Access Admin Portal
          </button>
        </div>
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setAuthScreen('login')}
            className="text-primary border-none bg-none font-[inherit] text-xs font-semibold"
          >
            &larr; Back to User Login
          </button>
        </div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform: scale(0.96) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }`}</style>
    </div>
  );
};
