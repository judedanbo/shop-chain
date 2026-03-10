import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import { useColors } from '@/context';
import { AuthBranding, AuthInput, AuthButton, PasswordStrength } from './AuthHelpers';

interface RegisterScreenProps {
  setAuthScreen: (screen: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ setAuthScreen }) => {
  const COLORS = useColors();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const u = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be 8+ characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!agreedTerms) e.terms = 'You must agree to the terms';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAuthScreen('verify');
    }, 1500);
  };

  return (
    <div>
      <AuthBranding />
      <div className="mb-6">
        <h1 className="text-text m-0 text-[22px] font-extrabold sm:text-[26px]">Create your account</h1>
        <p className="text-text-dim mt-1.5 mb-0 text-sm">Start managing your business in minutes</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <AuthInput
            icon={User}
            label="First Name"
            placeholder="Kofi"
            value={form.firstName}
            onChange={(e) => u('firstName', e.target.value)}
            error={errors.firstName}
          />
          <AuthInput
            label="Last Name"
            placeholder="Mensah"
            value={form.lastName}
            onChange={(e) => u('lastName', e.target.value)}
            error={errors.lastName}
          />
        </div>
        <AuthInput
          icon={Mail}
          label="Email Address"
          type="email"
          placeholder="kofi@example.com"
          value={form.email}
          onChange={(e) => u('email', e.target.value)}
          error={errors.email}
        />
        <AuthInput
          icon={Phone}
          label="Phone Number"
          type="tel"
          placeholder="+233 24 000 0000"
          value={form.phone}
          onChange={(e) => u('phone', e.target.value)}
          error={errors.phone}
        />
        <AuthInput
          icon={Lock}
          label="Password"
          type={showPass ? 'text' : 'password'}
          placeholder="Create a strong password"
          value={form.password}
          onChange={(e) => u('password', e.target.value)}
          error={errors.password}
          rightIcon={
            showPass ? <EyeOff size={16} className="text-text-dim" /> : <Eye size={16} className="text-text-dim" />
          }
          onRightIconClick={() => setShowPass(!showPass)}
        />
        <PasswordStrength password={form.password} />
        <AuthInput
          icon={Lock}
          label="Confirm Password"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={(e) => u('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          rightIcon={
            showConfirm ? <EyeOff size={16} className="text-text-dim" /> : <Eye size={16} className="text-text-dim" />
          }
          onRightIconClick={() => setShowConfirm(!showConfirm)}
        />

        {/* Terms */}
        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              setAgreedTerms(!agreedTerms);
              setErrors((prev) => ({ ...prev, terms: '' }));
            }}
            className="flex items-start gap-2.5 text-left"
          >
            <div
              className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] transition-all duration-200"
              style={{
                border: `1.5px solid ${errors.terms ? COLORS.danger : agreedTerms ? COLORS.primary : COLORS.border}`,
                background: agreedTerms ? COLORS.primary : 'transparent',
              }}
            >
              {agreedTerms && <Check size={12} className="text-white" />}
            </div>
            <span className="text-text-muted text-[13px] leading-[1.4]">
              I agree to the <span className="text-primary font-semibold">Terms of Service</span> and{' '}
              <span className="text-primary font-semibold">Privacy Policy</span>
            </span>
          </button>
          {errors.terms && (
            <div className="text-danger mt-1 ml-7 text-[11px]">
              <AlertTriangle size={11} /> {errors.terms}
            </div>
          )}
        </div>

        <div className="mt-1">
          <AuthButton onClick={handleRegister} loading={loading}>
            <ArrowRight size={16} /> Create Account
          </AuthButton>
        </div>
      </div>

      <div className="text-text-muted mt-5 text-center text-sm">
        Already have an account?{' '}
        <button type="button" onClick={() => setAuthScreen('login')} className="text-primary font-bold">
          Sign in
        </button>
      </div>
    </div>
  );
};
