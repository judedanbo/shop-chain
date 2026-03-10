import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { AuthBranding, AuthButton, OtpInput } from './AuthHelpers';

interface VerifyScreenProps {
  setAuthScreen: (screen: string) => void;
  onVerified: () => void;
}

export const VerifyScreen: React.FC<VerifyScreenProps> = ({ setAuthScreen, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [resendTimer]);

  const handleVerify = () => {
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
      setTimeout(() => onVerified(), 2000);
    }, 1200);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setOtp('');
    setError('');
  };

  if (verified) {
    return (
      <div className="py-10 text-center">
        <div
          className="bg-success-bg border-success/[0.25] mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full border-2"
          style={{
            animation: 'modalIn 0.5s ease',
          }}
        >
          <CheckCircle size={36} className="text-success" />
        </div>
        <h2 className="text-text m-0 mb-2 text-[22px] font-extrabold">Email Verified!</h2>
        <p className="text-text-dim m-0 text-sm">Redirecting you to set up your shop...</p>
        <div className="mt-5">
          <div
            className="border-border border-t-primary mx-auto h-[18px] w-[18px] rounded-full border-[2.5px]"
            style={{
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <AuthBranding />
      <div className="mb-7 text-center">
        <div className="bg-primary-bg mb-4 inline-flex h-[60px] w-[60px] items-center justify-center rounded-2xl">
          <Mail size={28} className="text-primary" />
        </div>
        <h1 className="text-text m-0 mb-2 text-[22px] font-extrabold sm:text-[26px]">Check your email</h1>
        <p className="text-text-dim m-0 text-sm leading-normal">
          We sent a verification code to
          <br />
          <span className="text-text font-bold">k&bull;&bull;&bull;@example.com</span>
        </p>
      </div>

      {error && (
        <div className="text-danger border-danger/[0.15] bg-danger-bg mb-4 rounded-[10px] border px-3.5 py-2.5 text-center text-[13px] font-medium">
          {error}
        </div>
      )}

      <div className="mb-6">
        <OtpInput
          length={6}
          value={otp}
          onChange={(v) => {
            setOtp(v);
            setError('');
          }}
        />
      </div>

      <AuthButton onClick={handleVerify} loading={loading} disabled={otp.length < 6}>
        <CheckCircle size={16} /> Verify Email
      </AuthButton>

      <div className="mt-5 text-center">
        {resendTimer > 0 ? (
          <span className="text-text-dim text-[13px]">
            Resend code in <span className="text-text font-mono font-bold">{resendTimer}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-primary inline-flex items-center gap-1 text-[13px] font-semibold"
          >
            <RefreshCw size={13} /> Resend code
          </button>
        )}
      </div>

      <div className="mt-3 text-center">
        <button type="button" onClick={() => setAuthScreen('register')} className="text-text-dim text-[13px]">
          <ArrowLeft size={12} className="mr-1 inline align-middle" />
          Change email address
        </button>
      </div>
    </div>
  );
};
