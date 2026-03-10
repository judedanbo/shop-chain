import React, { useState } from 'react';
import { Mail, KeyRound, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { AuthBranding, AuthInput, AuthButton } from './AuthHelpers';

interface ForgotPasswordScreenProps {
  setAuthScreen: (screen: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ setAuthScreen }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  if (sent) {
    return (
      <div>
        <AuthBranding />
        <div className="text-center">
          <div
            className="bg-success-bg border-success/[0.19] mb-4 inline-flex h-[60px] w-[60px] items-center justify-center rounded-2xl border-2"
            style={{
              animation: 'modalIn 0.4s ease',
            }}
          >
            <Mail size={28} className="text-success" />
          </div>
          <h2 className="text-text m-0 mb-2 text-[22px] font-extrabold">Check your inbox</h2>
          <p className="text-text-dim m-0 mb-6 text-sm leading-normal">
            We&apos;ve sent a password reset link to
            <br />
            <span className="text-text font-bold">{email}</span>
          </p>

          <div className="bg-surface-alt border-border mb-5 rounded-xl border p-4">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-text-dim mt-px shrink-0" />
              <div className="text-text-dim text-left text-xs leading-normal">
                If you don&apos;t see it, check your spam folder. The link expires in{' '}
                <span className="text-text font-bold">15 minutes</span>.
              </div>
            </div>
          </div>

          <div className="mb-3">
            <AuthButton onClick={() => setAuthScreen('reset')}>
              <KeyRound size={16} /> Open Reset Page
            </AuthButton>
          </div>
          <AuthButton
            variant="secondary"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            <RefreshCw size={14} /> Resend Email
          </AuthButton>
        </div>

        <div className="mt-6 text-center">
          <span
            onClick={() => setAuthScreen('login')}
            className="text-primary inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold"
          >
            <ArrowLeft size={13} /> Back to sign in
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthBranding />
      <div className="mb-7">
        <div className="bg-primary-bg mb-4 inline-flex h-[60px] w-[60px] items-center justify-center rounded-2xl">
          <KeyRound size={28} className="text-primary" />
        </div>
        <h1 className="text-text m-0 mb-1.5 text-[22px] font-extrabold sm:text-[26px]">Forgot password?</h1>
        <p className="text-text-dim m-0 text-sm leading-normal">
          No worries. Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        <AuthInput
          icon={Mail}
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthButton onClick={handleSend} loading={loading} disabled={!email}>
          <Mail size={16} /> Send Reset Link
        </AuthButton>
      </div>

      <div className="mt-6 text-center">
        <span
          onClick={() => setAuthScreen('login')}
          className="text-primary inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold"
        >
          <ArrowLeft size={13} /> Back to sign in
        </span>
      </div>
    </div>
  );
};
