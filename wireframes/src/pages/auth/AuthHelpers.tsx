import React, { useState, useRef } from 'react';
import { Store, AlertTriangle } from 'lucide-react';
import { useColors } from '@/context';
import { useBreakpoint } from '@/hooks';
import { clsx } from 'clsx';

// ─── Auth Branding ───

export const AuthBranding: React.FC = () => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  return (
    <div className="mb-7 text-center sm:mb-9">
      <div
        className="mb-3.5 inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl sm:h-[60px] sm:w-[60px]"
        style={{
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
          boxShadow: `0 8px 32px ${COLORS.primary}40`,
        }}
      >
        <Store size={bp === 'sm' ? 26 : 30} className="text-white" />
      </div>
      <div className="text-text text-[22px] font-extrabold tracking-[-0.5px] sm:text-[26px]">ShopChain</div>
      <div className="text-text-dim mt-1 text-[13px]">Inventory & POS for African Businesses</div>
    </div>
  );
};

// ─── Auth Input ───
interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ size: number; style?: React.CSSProperties; className?: string }>;
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  icon: Icon,
  type = 'text',
  label,
  error,
  rightIcon,
  onRightIconClick,
  ...props
}) => {
  const COLORS = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <div className={clsx(error && 'mb-1')}>
      {label && <label className="text-text-muted mb-1.5 block text-xs font-semibold">{label}</label>}
      <div
        className="bg-surface-alt flex items-center gap-2.5 rounded-xl px-3.5 py-[13px] transition-all duration-200"
        style={{
          border: `1.5px solid ${error ? COLORS.danger : focused ? COLORS.primary : COLORS.border}`,
          boxShadow: focused ? `0 0 0 3px ${COLORS.primary}18` : 'none',
        }}
      >
        {Icon && (
          <Icon
            size={18}
            className="shrink-0 transition-colors duration-200"
            style={{ color: focused ? COLORS.primary : COLORS.textDim }}
          />
        )}
        <input
          type={type}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className="text-text w-full border-none bg-transparent font-[inherit] text-sm outline-none"
          style={{
            letterSpacing: type === 'password' ? 2 : 0,
            ...(props.style || {}),
          }}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            aria-label="Toggle visibility"
            className="flex shrink-0 items-center p-0.5"
          >
            {rightIcon}
          </button>
        )}
      </div>
      {error && (
        <div className="text-danger mt-1 flex items-center gap-1 text-[11px]">
          <AlertTriangle size={11} /> {error}
        </div>
      )}
    </div>
  );
};

// ─── Auth Button ───
interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  children: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  variant = 'primary',
  loading,
  disabled,
  ...props
}) => {
  const COLORS = useColors();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      {...props}
      className={clsx(
        'flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-[inherit] text-sm font-bold transition-all duration-200',
        isDisabled ? 'cursor-not-allowed opacity-50' : 'opacity-100',
      )}
      style={{
        border: isPrimary ? 'none' : `1.5px solid ${COLORS.border}`,
        background: isPrimary ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` : 'transparent',
        color: isPrimary ? '#fff' : COLORS.text,
        boxShadow: isPrimary && !isDisabled ? `0 4px 20px ${COLORS.primary}40` : 'none',
        ...(props.style || {}),
      }}
    >
      {loading ? (
        <div
          className="h-[18px] w-[18px] rounded-full"
          style={{
            border: '2.5px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      ) : (
        children
      )}
    </button>
  );
};

// ─── Password Strength ───
interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const COLORS = useColors();
  const checks = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.met).length;
  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="mb-1.5 flex gap-[3px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-sm transition-all duration-300"
            style={{
              background: i < strength ? colors[strength - 1] : COLORS.border,
            }}
          />
        ))}
      </div>
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="text-[11px] font-semibold"
          style={{ color: strength > 0 ? colors[strength - 1] : COLORS.textDim }}
        >
          {strength > 0 ? labels[strength - 1] : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {checks.map((c, i) => (
          <span
            key={i}
            className={clsx(
              'rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-all duration-300',
              c.met ? 'border-success/[0.19] bg-success-bg text-success' : 'border-border bg-surface-alt text-text-dim',
            )}
          >
            {c.met ? '\u2713' : '\u25CB'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── OTP Input ───
interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onChange }) => {
  const COLORS = useColors();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleChange = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[idx] = val;
    const newVal = newDigits.join('').slice(0, length);
    onChange(newVal);
    if (val && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, length - 1);
    refs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="text-text h-14 w-12 rounded-xl text-center font-[inherit] text-[22px] font-bold transition-all duration-200 outline-none"
          style={{
            border: `2px solid ${d ? COLORS.primary : COLORS.border}`,
            background: d ? COLORS.primaryBg : COLORS.surfaceAlt,
            caretColor: COLORS.primary,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = COLORS.primary;
            e.target.style.boxShadow = `0 0 0 3px ${COLORS.primary}18`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = d ? COLORS.primary : COLORS.border;
            e.target.style.boxShadow = 'none';
          }}
        />
      ))}
    </div>
  );
};

// ─── Social Button ───
interface SocialButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ icon, label, ...props }) => {
  return (
    <button
      type="button"
      {...props}
      className="text-text border-border hover:bg-surface-alt hover:border-text-dim flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-solid bg-transparent px-4 py-3 font-[inherit] text-[13px] font-semibold transition-all duration-150"
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );
};
