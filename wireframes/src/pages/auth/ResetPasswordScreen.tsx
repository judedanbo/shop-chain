import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { AuthBranding, AuthInput, AuthButton, PasswordStrength } from './AuthHelpers';

interface ResetPasswordScreenProps {
  setAuthScreen: (screen: string) => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ setAuthScreen }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    if (!password || !confirm) {
      setError('Please fill in both fields');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setAuthScreen('login'), 3000);
    }, 1500);
  };

  if (success) {
    return (
      <div>
        <AuthBranding />
        <div className="py-5 text-center">
          <div
            className="bg-success-bg border-success/[0.25] mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full border-2"
            style={{
              animation: 'modalIn 0.5s ease',
            }}
          >
            <CheckCircle size={36} className="text-success" />
          </div>
          <h2 className="text-text m-0 mb-2 text-[22px] font-extrabold">Password Updated!</h2>
          <p className="text-text-dim m-0 mb-5 text-sm leading-normal">
            Your password has been reset successfully.
            <br />
            Redirecting to sign in...
          </p>
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
      <div className="mb-7">
        <div className="bg-primary-bg mb-4 inline-flex h-[60px] w-[60px] items-center justify-center rounded-2xl">
          <Lock size={28} className="text-primary" />
        </div>
        <h1 className="text-text m-0 mb-1.5 text-[22px] font-extrabold sm:text-[26px]">Set new password</h1>
        <p className="text-text-dim m-0 text-sm leading-normal">
          Your new password must be different from your previous password.
        </p>
      </div>

      {error && (
        <div className="text-danger border-danger/[0.15] bg-danger-bg mb-4 flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-[13px] font-medium">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <AuthInput
          icon={Lock}
          label="New Password"
          type={showPass ? 'text' : 'password'}
          placeholder="Enter new password"
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
        <PasswordStrength password={password} />
        <AuthInput
          icon={Lock}
          label="Confirm New Password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Re-enter new password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setError('');
          }}
          rightIcon={
            showConfirm ? <EyeOff size={16} className="text-text-dim" /> : <Eye size={16} className="text-text-dim" />
          }
          onRightIconClick={() => setShowConfirm(!showConfirm)}
        />
        {confirm && password && confirm === password && (
          <div className="text-success flex items-center gap-1.5 text-xs font-semibold">
            <CheckCircle size={14} /> Passwords match
          </div>
        )}
        <div className="mt-1">
          <AuthButton onClick={handleReset} loading={loading} disabled={!password || !confirm}>
            <Lock size={16} /> Reset Password
          </AuthButton>
        </div>
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
