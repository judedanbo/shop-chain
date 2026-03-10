import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Check, AlertTriangle, Shield } from 'lucide-react';
import { useColors } from '@/context';
import { AuthBranding, AuthInput, AuthButton, SocialButton } from './AuthHelpers';

interface LoginScreenProps {
  setAuthScreen: (screen: string) => void;
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ setAuthScreen, onLogin }) => {
  const COLORS = useColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 1500);
  };

  return (
    <div>
      <AuthBranding />
      <div className="mb-7">
        <h1 className="text-text m-0 text-[22px] font-extrabold sm:text-[26px]">Welcome back</h1>
        <p className="text-text-dim mt-1.5 mb-0 text-sm">Sign in to manage your shop</p>
      </div>

      {error && (
        <div
          className="text-danger border-danger/[0.15] bg-danger-bg mb-4 flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-[13px] font-medium"
          style={{
            animation: 'modalIn 0.25s ease',
          }}
        >
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <AuthInput
          icon={Mail}
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
        />
        <AuthInput
          icon={Lock}
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          rightIcon={
            showPass ? <EyeOff size={16} className="text-text-dim" /> : <Eye size={16} className="text-text-dim" />
          }
          onRightIconClick={() => setShowPass(!showPass)}
        />

        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2">
            <div
              className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] transition-all duration-200"
              style={{
                border: `1.5px solid ${rememberMe ? COLORS.primary : COLORS.border}`,
                background: rememberMe ? COLORS.primary : 'transparent',
              }}
            >
              {rememberMe && <Check size={12} className="text-white" />}
            </div>
            <span className="text-text-muted text-[13px]">Remember me</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthScreen('forgot')}
            className="text-primary text-[13px] font-semibold"
          >
            Forgot password?
          </button>
        </div>

        <AuthButton onClick={handleLogin} loading={loading} disabled={!email || !password}>
          <Lock size={16} /> Sign In
        </AuthButton>
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3.5">
        <div className="bg-border h-px flex-1" />
        <span className="text-text-dim text-[11px] font-semibold tracking-[1px] uppercase">or</span>
        <div className="bg-border h-px flex-1" />
      </div>

      {/* Social */}
      <div className="mb-7 flex gap-2.5">
        <SocialButton icon="G" label="Google" />
        <SocialButton icon="" label="Apple" />
      </div>

      <div className="text-text-muted text-center text-sm">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={() => setAuthScreen('register')} className="text-primary font-bold">
          Create account
        </button>
      </div>
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setAuthScreen('adminLogin')}
          className="text-text-dim inline-flex items-center gap-1 text-[11px] font-semibold opacity-70"
        >
          <Shield size={11} /> Admin Portal
        </button>
      </div>
    </div>
  );
};
