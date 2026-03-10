import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  CreditCard,
  FileCheck,
  CheckCircle,
  Phone,
  Mail,
  User,
  Globe,
  Star,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors } from '@/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { SUPPLIERS } from '@/constants/demoData';

interface SupplierFormData {
  name: string;
  contact: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  rating: number;
  // Financial
  bankName: string;
  accountNumber: string;
  accountName: string;
  momoProvider: string;
  momoNumber: string;
  paymentTerms: string;
  currency: string;
  taxId: string;
  // Documents
  businessLicense: boolean;
  taxClearance: boolean;
  insuranceCert: boolean;
  notes: string;
}

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierFormData) => void;
  compact?: boolean;
}

const GHANA_BANKS = [
  { value: '', label: 'Select Bank...' },
  { value: 'gcb', label: 'GCB Bank' },
  { value: 'ecobank', label: 'Ecobank Ghana' },
  { value: 'stanbic', label: 'Stanbic Bank' },
  { value: 'absa', label: 'Absa Bank Ghana' },
  { value: 'fidelity', label: 'Fidelity Bank Ghana' },
  { value: 'calbank', label: 'CalBank' },
  { value: 'uba', label: 'UBA Ghana' },
  { value: 'zenith', label: 'Zenith Bank Ghana' },
  { value: 'fnb', label: 'First National Bank' },
  { value: 'access', label: 'Access Bank Ghana' },
  { value: 'republic', label: 'Republic Bank' },
  { value: 'adb', label: 'ADB' },
  { value: 'prudential', label: 'Prudential Bank' },
  { value: 'societe', label: 'Societe Generale' },
  { value: 'other', label: 'Other' },
];

const MOMO_PROVIDERS = [
  { value: '', label: 'Select Provider...' },
  { value: 'mtn', label: 'MTN Mobile Money' },
  { value: 'vodafone', label: 'Vodafone Cash' },
  { value: 'airteltigo', label: 'AirtelTigo Money' },
];

const PAYMENT_TERMS_OPTIONS = [
  { value: 'cod', label: 'Cash on Delivery' },
  { value: 'net15', label: 'Net 15 Days' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net60', label: 'Net 60 Days' },
  { value: 'prepaid', label: 'Prepaid' },
];

const REGIONS = [
  { value: '', label: 'Select Location...' },
  { value: 'Accra, Greater Accra', label: 'Accra, Greater Accra' },
  { value: 'Tema, Greater Accra', label: 'Tema, Greater Accra' },
  { value: 'Kumasi, Ashanti', label: 'Kumasi, Ashanti' },
  { value: 'Tamale, Northern', label: 'Tamale, Northern' },
  { value: 'Takoradi, Western', label: 'Takoradi, Western' },
  { value: 'Cape Coast, Central', label: 'Cape Coast, Central' },
  { value: 'Koforidua, Eastern', label: 'Koforidua, Eastern' },
  { value: 'Ho, Volta', label: 'Ho, Volta' },
  { value: 'Sunyani, Bono', label: 'Sunyani, Bono' },
  { value: 'Bolgatanga, Upper East', label: 'Bolgatanga, Upper East' },
  { value: 'other', label: 'Other' },
];

const initialFormData: SupplierFormData = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  location: '',
  website: '',
  rating: 3,
  bankName: '',
  accountNumber: '',
  accountName: '',
  momoProvider: '',
  momoNumber: '',
  paymentTerms: 'net30',
  currency: 'GHS',
  taxId: '',
  businessLicense: false,
  taxClearance: false,
  insuranceCert: false,
  notes: '',
};

export const AddSupplierModal: React.FC<AddSupplierModalProps> = ({ isOpen, onClose, onSubmit, compact = false }) => {
  const COLORS = useColors();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SupplierFormData>(initialFormData);

  if (!isOpen) return null;

  const updateForm = (field: keyof SupplierFormData, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isDuplicate = SUPPLIERS.some(
    (s) =>
      s.name.toLowerCase() === form.name.trim().toLowerCase() ||
      (form.email.trim() && s.email.toLowerCase() === form.email.trim().toLowerCase()),
  );

  const isStep1Valid =
    form.name.trim() && form.contact.trim() && form.phone.trim() && form.email.trim() && form.location && !isDuplicate;
  const canSubmit = isStep1Valid;

  const handleSubmit = () => {
    onSubmit(form);
    setForm(initialFormData);
    setStep(1);
    onClose();
  };

  const handleClose = () => {
    setForm(initialFormData);
    setStep(1);
    onClose();
  };

  const steps = [
    { num: 1, label: 'Company Info', icon: Building2 },
    { num: 2, label: 'Financial', icon: CreditCard },
    { num: 3, label: 'Documents & Review', icon: FileCheck },
  ];

  return (
    <>
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
      />
      <div
        className={clsx(
          'bg-surface z-modal fixed flex flex-col overflow-hidden',
          'max-h-screen w-full sm:max-h-[92vh] sm:w-[96%]',
          'rounded-none sm:rounded-2xl',
          compact ? 'md:w-[520px]' : 'md:w-[600px]',
        )}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
            >
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <div className="text-text text-[15px] font-bold">Add Supplier</div>
              <div className="text-text-dim text-[11px]">
                Step {step} of 3 — {steps[step - 1]?.label}
              </div>
            </div>
          </div>
          <div
            onClick={handleClose}
            className="bg-surface-alt flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
          >
            <X size={16} className="text-text-muted" />
          </div>
        </div>

        {/* Step Progress */}
        <div className="border-border flex items-center gap-1 border-b px-5 py-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <React.Fragment key={s.num}>
                <div
                  className={clsx('flex items-center gap-1.5 rounded-lg px-2.5 py-1', isDone && 'cursor-pointer')}
                  style={{
                    background: isActive ? `${COLORS.primary}15` : isDone ? `${COLORS.success}10` : 'transparent',
                  }}
                  onClick={() => isDone && setStep(s.num)}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-[6px]"
                    style={{
                      background: isActive ? COLORS.primary : isDone ? COLORS.success : COLORS.surfaceAlt,
                    }}
                  >
                    {isDone ? (
                      <CheckCircle size={12} className="text-white" />
                    ) : (
                      <Icon size={12} style={{ color: isActive ? '#fff' : COLORS.textDim }} />
                    )}
                  </div>
                  <span
                    className="hidden text-[11px] font-semibold sm:inline"
                    style={{ color: isActive ? COLORS.primary : isDone ? COLORS.success : COLORS.textDim }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="h-0.5 flex-1 rounded-[1px] transition-colors duration-300"
                    style={{ background: isDone ? COLORS.success : COLORS.border }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Step 1: Company Info */}
          {step === 1 && (
            <div className="flex flex-col gap-3.5">
              {/* Company Name */}
              <div>
                <label className="form-label mb-1 block">Company Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="e.g. GoldGrain Ltd"
                  icon={Building2}
                />
                {isDuplicate && form.name.trim() && (
                  <div className="text-danger mt-[3px] text-[11px]">
                    A supplier with this name or email already exists
                  </div>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <label className="form-label mb-1 block">Contact Person *</label>
                <Input
                  value={form.contact}
                  onChange={(e) => updateForm('contact', e.target.value)}
                  placeholder="e.g. Kwame Asante"
                  icon={User}
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label mb-1 block">Phone Number *</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+233 24 123 4567"
                    icon={Phone}
                  />
                </div>
                <div>
                  <label className="form-label mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="supplier@example.com"
                    icon={Mail}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="form-label mb-1 block">Location *</label>
                <Select
                  value={form.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  options={REGIONS}
                />
              </div>

              {/* Website */}
              <div>
                <label className="form-label mb-1 block">Website (Optional)</label>
                <Input
                  value={form.website}
                  onChange={(e) => updateForm('website', e.target.value)}
                  placeholder="https://www.example.com"
                  icon={Globe}
                />
              </div>

              {/* Rating */}
              <div>
                <label className="form-label mb-1.5 block">Initial Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      onClick={() => updateForm('rating', n)}
                      className="cursor-pointer transition-transform duration-150 hover:scale-[1.15]"
                    >
                      <Star
                        size={22}
                        style={{
                          color: n <= form.rating ? '#F59E0B' : COLORS.border,
                          fill: n <= form.rating ? '#F59E0B' : 'none',
                        }}
                      />
                    </div>
                  ))}
                  <span className="text-text-muted ml-1 text-xs font-semibold">{form.rating}.0</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Financial Details */}
          {step === 2 && (
            <div className="flex flex-col gap-3.5">
              {/* Bank Details */}
              <div className="bg-surface-alt border-border rounded-xl border p-3.5">
                <div className="text-text mb-2.5 flex items-center gap-1.5 text-xs font-bold">
                  <CreditCard size={14} className="text-primary" /> Bank Details
                </div>
                <div className="flex flex-col gap-2.5">
                  <div>
                    <label className="form-label mb-1 block">Bank</label>
                    <Select
                      value={form.bankName}
                      onChange={(e) => updateForm('bankName', e.target.value)}
                      options={GHANA_BANKS}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="form-label mb-1 block">Account Name</label>
                      <Input
                        value={form.accountName}
                        onChange={(e) => updateForm('accountName', e.target.value)}
                        placeholder="Account holder name"
                      />
                    </div>
                    <div>
                      <label className="form-label mb-1 block">Account Number</label>
                      <Input
                        value={form.accountNumber}
                        onChange={(e) => updateForm('accountNumber', e.target.value)}
                        placeholder="0123456789"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Money */}
              <div className="bg-surface-alt border-border rounded-xl border p-3.5">
                <div className="text-text mb-2.5 flex items-center gap-1.5 text-xs font-bold">
                  <Phone size={14} className="text-primary" /> Mobile Money
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <div>
                    <label className="form-label mb-1 block">Provider</label>
                    <Select
                      value={form.momoProvider}
                      onChange={(e) => updateForm('momoProvider', e.target.value)}
                      options={MOMO_PROVIDERS}
                    />
                  </div>
                  <div>
                    <label className="form-label mb-1 block">MoMo Number</label>
                    <Input
                      value={form.momoNumber}
                      onChange={(e) => updateForm('momoNumber', e.target.value)}
                      placeholder="024 123 4567"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Terms & Tax */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="form-label mb-1 block">Payment Terms</label>
                  <Select
                    value={form.paymentTerms}
                    onChange={(e) => updateForm('paymentTerms', e.target.value)}
                    options={PAYMENT_TERMS_OPTIONS}
                  />
                </div>
                <div>
                  <label className="form-label mb-1 block">Tax ID / TIN</label>
                  <Input
                    value={form.taxId}
                    onChange={(e) => updateForm('taxId', e.target.value)}
                    placeholder="e.g. GHA-1234567"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents & Review */}
          {step === 3 && (
            <div className="flex flex-col gap-3.5">
              {/* Document Checklist */}
              <div>
                <label className="form-label mb-2 block">Document Checklist</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      key: 'businessLicense' as const,
                      label: 'Business Registration / License',
                      desc: 'Company registration certificate',
                    },
                    {
                      key: 'taxClearance' as const,
                      label: 'Tax Clearance Certificate',
                      desc: 'Valid GRA tax clearance',
                    },
                    {
                      key: 'insuranceCert' as const,
                      label: 'Insurance Certificate',
                      desc: 'Liability or goods insurance',
                    },
                  ].map((doc) => (
                    <div
                      key={doc.key}
                      onClick={() => updateForm(doc.key, !form[doc.key])}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 transition-all duration-150"
                      style={{
                        background: form[doc.key] ? `${COLORS.success}10` : COLORS.surfaceAlt,
                        border: `1px solid ${form[doc.key] ? COLORS.success + '40' : COLORS.border}`,
                      }}
                    >
                      <div
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px]"
                        style={{
                          background: form[doc.key] ? COLORS.success : COLORS.surface,
                          border: `1.5px solid ${form[doc.key] ? COLORS.success : COLORS.border}`,
                        }}
                      >
                        {form[doc.key] && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <div>
                        <div className="text-text text-xs font-semibold">{doc.label}</div>
                        <div className="text-text-dim text-[10px]">{doc.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label mb-1 block">Notes (Optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="Additional notes about this supplier..."
                  rows={3}
                  className="bg-surface-alt border-border text-text box-border w-full resize-none rounded-lg border px-3 py-2 font-[inherit] text-xs outline-none"
                />
              </div>

              {/* Review Summary */}
              <div className="bg-surface-alt border-border rounded-xl border p-3.5">
                <div className="form-label mb-2.5">Review Summary</div>
                <div className="flex flex-col gap-2">
                  {/* Company Section */}
                  <div className="border-border flex items-center gap-2.5 border-b pb-2">
                    <div className="bg-primary/[0.08] flex h-10 w-10 items-center justify-center rounded-[10px]">
                      <Building2 size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-text text-sm font-bold">{form.name || '—'}</div>
                      <div className="text-text-dim text-[11px]">
                        {form.contact || '—'} · {form.location || '—'}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={12}
                          style={{
                            color: n <= form.rating ? '#F59E0B' : COLORS.border,
                            fill: n <= form.rating ? '#F59E0B' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px]">Phone</div>
                      <div className="text-text text-xs font-semibold">{form.phone || '—'}</div>
                    </div>
                    <div>
                      <div className="text-text-dim mb-0.5 text-[10px]">Email</div>
                      <div className="text-text text-xs font-semibold">{form.email || '—'}</div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  {(form.bankName || form.momoProvider) && (
                    <div className="border-border border-t pt-2">
                      <div className="text-text-dim mb-1.5 text-[10px] font-bold">Financial</div>
                      <div className="flex flex-wrap gap-1.5">
                        {form.bankName && (
                          <Badge color="primary">
                            {GHANA_BANKS.find((b) => b.value === form.bankName)?.label || form.bankName}
                          </Badge>
                        )}
                        {form.momoProvider && (
                          <Badge color="accent">
                            {MOMO_PROVIDERS.find((p) => p.value === form.momoProvider)?.label || form.momoProvider}
                          </Badge>
                        )}
                        <Badge color="neutral">
                          {PAYMENT_TERMS_OPTIONS.find((p) => p.value === form.paymentTerms)?.label || form.paymentTerms}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Documents Summary */}
                  <div className="border-border border-t pt-2">
                    <div className="text-text-dim mb-1.5 text-[10px] font-bold">Documents</div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge color={form.businessLicense ? 'success' : 'neutral'}>
                        {form.businessLicense ? 'License' : 'No License'}
                      </Badge>
                      <Badge color={form.taxClearance ? 'success' : 'neutral'}>
                        {form.taxClearance ? 'Tax Cleared' : 'No Tax Cert'}
                      </Badge>
                      <Badge color={form.insuranceCert ? 'success' : 'neutral'}>
                        {form.insuranceCert ? 'Insured' : 'No Insurance'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border flex justify-between gap-2 border-t px-5 py-3.5">
          <div>
            {step > 1 && (
              <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !isStep1Valid : false}
              >
                Next <ChevronRight size={14} />
              </Button>
            ) : (
              <Button variant="primary" size="sm" icon={CheckCircle} onClick={handleSubmit} disabled={!canSubmit}>
                Add Supplier
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
