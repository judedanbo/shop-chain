import { useState } from 'react';
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  ChevronRight,
  Edit,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Save,
  Lock,
  Link2,
  Copy,
  Check,
  X,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation, useShop } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { Paginator, StatCard, TabButton } from '@/components/ui';

interface RoleDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  access: string;
}

export const ROLES: RoleDef[] = [
  {
    id: 'owner',
    label: 'Owner',
    icon: '\uD83D\uDC51',
    color: '#F59E0B',
    description: 'Full access including billing, shop deletion, and team management',
    access: 'Everything',
  },
  {
    id: 'general_manager',
    label: 'General Manager',
    icon: '\uD83C\uDF10',
    color: '#0EA5E9',
    description: 'Full operational access across all branches \u2014 team, inventory, POS, reports',
    access: 'All branches: Dashboard, Products, POS, Orders, Suppliers, Warehouses, Team, Reports',
  },
  {
    id: 'manager',
    label: 'Manager',
    icon: '\uD83D\uDD37',
    color: '#3B82F6',
    description: 'All operations except billing and shop deletion',
    access: 'Dashboard, Products, POS, Orders, Suppliers, Warehouses, Team (view), Reports',
  },
  {
    id: 'inventory_manager',
    label: 'Inventory Manager',
    icon: '\uD83D\uDCE6',
    color: '#10B981',
    description: 'Full inventory control \u2014 products, stock, suppliers, warehouses',
    access: 'Products, Categories, Units, Purchase Orders, Warehouses, Adjustments, Transfers',
  },
  {
    id: 'inventory_officer',
    label: 'Inventory Officer',
    icon: '\uD83D\uDCCB',
    color: '#06B6D4',
    description: 'Day-to-day stock operations \u2014 receiving, adjustments, transfers',
    access: 'Products (view/edit), Adjustments, Transfers, Receiving',
  },
  {
    id: 'salesperson',
    label: 'Salesperson',
    icon: '\uD83D\uDED2',
    color: '#8B5CF6',
    description: 'POS access and customer-facing operations',
    access: 'POS, View products, Own transaction history',
  },
  {
    id: 'cashier',
    label: 'Cashier',
    icon: '\uD83D\uDCB0',
    color: '#EF4444',
    description: 'POS register only \u2014 no void, no discounts above threshold',
    access: 'POS only (restricted)',
  },
  {
    id: 'accountant',
    label: 'Accountant',
    icon: '\uD83D\uDCCA',
    color: '#F97316',
    description: 'Financial oversight \u2014 analytics, reports, transaction history',
    access: 'Dashboard analytics, Reports, Purchase Orders (view), Transactions',
  },
  {
    id: 'viewer',
    label: 'Viewer',
    icon: '\uD83D\uDC41\uFE0F',
    color: '#6B7280',
    description: 'Read-only access across all modules',
    access: 'View everything, edit nothing',
  },
];

export const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'usr-001',
    name: 'Jude Appiah',
    email: 'jude@shopchain.com',
    phone: '+233 24 111 2222',
    role: 'owner',
    status: 'active',
    avatar: 'JA',
    lastActive: 'Just now',
    joinedDate: '2025-06-15',
  },
  {
    id: 'usr-002',
    name: 'Ama Darko',
    email: 'ama.d@shopchain.com',
    phone: '+233 20 333 4444',
    role: 'manager',
    status: 'active',
    avatar: 'AD',
    lastActive: '1 hour ago',
    joinedDate: '2025-07-01',
  },
  {
    id: 'usr-003',
    name: 'Kwame Boateng',
    email: 'kwame.b@gmail.com',
    phone: '+233 55 666 7777',
    role: 'salesperson',
    status: 'active',
    avatar: 'KB',
    lastActive: '3 hours ago',
    joinedDate: '2025-08-10',
  },
  {
    id: 'usr-004',
    name: 'Efua Mensah',
    email: 'efua.m@gmail.com',
    phone: '+233 24 888 9999',
    role: 'inventory_manager',
    status: 'active',
    avatar: 'EM',
    lastActive: 'Yesterday',
    joinedDate: '2025-09-01',
  },
  {
    id: 'usr-005',
    name: 'Yaw Asante',
    email: 'yaw.a@outlook.com',
    phone: '+233 50 222 3333',
    role: 'cashier',
    status: 'pending',
    avatar: 'YA',
    lastActive: 'Never',
    joinedDate: '2026-02-10',
  },
  {
    id: 'usr-006',
    name: 'Abena Osei',
    email: 'abena.o@yahoo.com',
    phone: '+233 27 444 5555',
    role: 'inventory_officer',
    status: 'deactivated',
    avatar: 'AO',
    lastActive: '2 weeks ago',
    joinedDate: '2025-11-20',
  },
];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar: string;
  lastActive: string;
  joinedDate: string;
}

export const getRoleMeta = (roleId: string): RoleDef =>
  ROLES.find((r) => r.id === roleId) ??
  ROLES[ROLES.length - 1] ?? {
    id: 'viewer',
    label: 'Viewer',
    icon: '\uD83D\uDC41\uFE0F',
    color: '#6B7280',
    description: 'Read-only access',
    access: 'View everything',
  };

// ---- AuthInput helper (local) ----
const AuthInput = ({
  icon: Icon,
  type = 'text',
  label,
  ...props
}: {
  icon?: React.ElementType;
  type?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  [key: string]: unknown;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}) => {
  const COLORS = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && <label className="text-text-muted mb-1.5 block text-xs font-semibold">{label}</label>}
      <div
        className="bg-surface-alt flex items-center gap-2.5 rounded-xl px-3.5 py-[13px] transition-all duration-200"
        style={{
          border: `1.5px solid ${focused ? COLORS.primary : COLORS.border}`,
          boxShadow: focused ? `0 0 0 3px ${COLORS.primary}18` : 'none',
        }}
      >
        {Icon && (
          <Icon
            size={18}
            className={clsx('shrink-0 transition-colors duration-200', focused ? 'text-primary' : 'text-text-dim')}
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
      </div>
    </div>
  );
};

// ---- InviteMemberModal ----
const InviteMemberModal = ({ onClose, onInvite }: { onClose: () => void; onInvite: (member: TeamMember) => void }) => {
  const COLORS = useColors();
  const [tab, setTab] = useState('email');
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const canSend = form.name.trim() && form.role && (tab === 'email' ? form.email.trim() : form.phone.trim());

  const handleSend = () => {
    if (!canSend) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      const initials = form.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      setTimeout(() => {
        onInvite({
          id: `usr-${Date.now()}`,
          name: form.name,
          email: form.email || '\u2014',
          phone: form.phone || '\u2014',
          role: form.role,
          status: 'pending',
          avatar: initials,
          lastActive: 'Never',
          joinedDate: new Date().toISOString().slice(0, 10),
        });
      }, 1500);
    }, 1500);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (sent) {
    return (
      <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/55 p-4">
        <div
          className="bg-surface border-border w-full max-w-[440px] rounded-[20px] border p-7 text-center sm:p-9"
          style={{ animation: 'modalIn 0.3s ease' }}
        >
          <div className="bg-success-bg border-success/[0.25] mb-4 inline-flex size-[72px] items-center justify-center rounded-full border-[3px]">
            <CheckCircle size={34} className="text-success" />
          </div>
          <h3 className="text-text m-0 mb-1.5 text-xl font-extrabold">Invitation Sent!</h3>
          <p className="text-text-dim m-0 mb-1 text-sm">
            {tab === 'email' ? `We've emailed an invite to` : `We've texted an invite to`}
          </p>
          <p className="text-text m-0 mb-4 text-sm font-bold">
            {form.name} ({tab === 'email' ? form.email : form.phone})
          </p>
          <div className="bg-primary-bg border-primary/[0.13] mb-5 inline-flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5">
            <span className="text-base">{getRoleMeta(form.role).icon}</span>
            <span className="text-primary text-[13px] font-bold">Assigned: {getRoleMeta(form.role).label}</span>
          </div>
          <div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] border-none px-7 py-[11px] font-[inherit] text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="bg-surface border-border flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[20px] border"
        style={{ animation: 'modalIn 0.25s ease' }}
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-[18px]">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary-bg flex size-9 items-center justify-center rounded-[10px]">
              <UserPlus size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-text text-base font-bold">Invite Team Member</div>
              <div className="text-text-dim text-xs">Send an invite via email or SMS</div>
            </div>
          </div>
          <div
            onClick={onClose}
            className="text-text-dim hover:bg-surface-alt flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
          >
            <X size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-surface-alt mb-5 flex gap-1 rounded-xl p-1">
            {[
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'sms', label: 'SMS', icon: Phone },
            ].map((t) => (
              <TabButton
                key={t.id}
                active={tab === t.id}
                variant="pill"
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-center',
                  tab === t.id ? 'bg-surface text-text' : 'text-text-dim',
                )}
                style={{
                  boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <t.icon size={14} className={tab === t.id ? 'text-primary' : 'text-text-dim'} />
                <span className={clsx('text-[13px]', tab === t.id ? 'font-bold' : 'font-medium')}>{t.label}</span>
              </TabButton>
            ))}
          </div>

          <div className="flex flex-col gap-3.5">
            <AuthInput
              icon={User}
              label="Full Name *"
              placeholder="e.g. Ama Darko"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {tab === 'email' ? (
              <AuthInput
                icon={Mail}
                label="Email Address *"
                type="email"
                placeholder="ama@example.com"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            ) : (
              <AuthInput
                icon={Phone}
                label="Phone Number *"
                type="tel"
                placeholder="+233 24 000 0000"
                value={form.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            )}
          </div>

          <div className="mt-5">
            <label className="text-text-muted mb-2.5 block text-xs font-bold tracking-wide uppercase">
              Assign a Role *
            </label>
            <div className="flex flex-col gap-1.5">
              {ROLES.filter((r) => r.id !== 'owner').map((r) => {
                const sel = form.role === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setForm((p) => ({ ...p, role: r.id }))}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200"
                    style={{
                      border: `1.5px solid ${sel ? r.color : COLORS.border}`,
                      background: sel ? `${r.color}10` : COLORS.surfaceAlt,
                    }}
                  >
                    <span className="shrink-0 text-xl">{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold" style={{ color: sel ? r.color : COLORS.text }}>
                        {r.label}
                      </div>
                      <div className="text-text-dim overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
                        {r.description}
                      </div>
                    </div>
                    <div
                      className="flex size-5 shrink-0 items-center justify-center rounded-full"
                      style={{ border: `2px solid ${sel ? r.color : COLORS.border}` }}
                    >
                      {sel && <div className="size-2.5 rounded-full" style={{ background: r.color }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface-alt border-border mt-5 flex items-center justify-between rounded-[10px] border px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-text-dim" />
              <span className="text-text-dim text-xs">Or share an invite link</span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={clsx(
                'flex items-center gap-1 rounded-lg px-3 py-[5px] font-[inherit] text-xs font-semibold',
                copied ? 'bg-success-bg text-success' : 'text-primary',
              )}
              style={{
                border: `1px solid ${copied ? COLORS.success : COLORS.border}`,
              }}
            >
              {copied ? (
                <>
                  <Check size={12} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-text-muted rounded-[10px] border-[1.5px] bg-transparent px-5 py-2.5 font-[inherit] text-[13px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || sending}
            className={clsx(
              'flex items-center gap-1.5 rounded-[10px] border-none px-6 py-2.5 font-[inherit] text-[13px] font-bold',
              canSend && !sending ? 'cursor-pointer' : 'cursor-not-allowed',
            )}
            style={{
              background:
                canSend && !sending
                  ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                  : COLORS.surfaceAlt,
              color: canSend && !sending ? '#fff' : COLORS.textDim,
            }}
          >
            {sending ? (
              <>
                <div
                  className="size-3.5 rounded-full"
                  style={{
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />{' '}
                Sending...
              </>
            ) : (
              <>
                <Mail size={14} /> Send Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- EditMemberModal ----
const EditMemberModal = ({
  member,
  onClose,
  onUpdate,
  onRemove,
}: {
  member: TeamMember;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
  onRemove: (id: string) => void;
}) => {
  const COLORS = useColors();
  const [selectedRole, setSelectedRole] = useState(member.role);
  const [status, setStatus] = useState(member.status);
  const [saving, setSaving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const isOwner = member.role === 'owner';
  const roleMeta = getRoleMeta(member.role);
  const changed = selectedRole !== member.role || status !== member.status;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onUpdate(member.id, { role: selectedRole, status });
      setSaving(false);
      onClose();
    }, 800);
  };

  return (
    <div
      aria-hidden="true"
      className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="bg-surface border-border flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[20px] border"
        style={{ animation: 'modalIn 0.25s ease' }}
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-[18px]">
          <div className="text-text text-base font-bold">Edit Team Member</div>
          <div
            onClick={onClose}
            className="text-text-dim hover:bg-surface-alt flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
          >
            <X size={18} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-surface-alt mb-5 flex items-center gap-3.5 rounded-[14px] px-[18px] py-4">
            <div
              className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] text-lg font-extrabold"
              style={{
                background: `linear-gradient(135deg, ${roleMeta.color}40, ${roleMeta.color}20)`,
                color: roleMeta.color,
                border: `2px solid ${roleMeta.color}30`,
              }}
            >
              {member.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text text-base font-bold">{member.name}</div>
              <div className="text-text-dim flex flex-wrap items-center gap-1.5 text-xs">
                <span className="flex items-center gap-[3px]">
                  <Mail size={11} /> {member.email}
                </span>
                <span>{'\u00B7'}</span>
                <span className="flex items-center gap-[3px]">
                  <Phone size={11} /> {member.phone}
                </span>
              </div>
              <div className="text-text-dim mt-1 flex items-center gap-1 text-[11px]">
                <Calendar size={10} /> Joined {member.joinedDate}
              </div>
            </div>
          </div>

          {!isOwner && (
            <div className="mb-5">
              <label className="text-text-muted mb-2.5 block text-xs font-bold tracking-wide uppercase">
                Account Status
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'active', label: 'Active', color: COLORS.success, icon: CheckCircle },
                  { id: 'deactivated', label: 'Deactivated', color: COLORS.textDim, icon: UserMinus },
                ].map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setStatus(s.id)}
                    className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-200"
                    style={{
                      border: `1.5px solid ${status === s.id ? s.color : COLORS.border}`,
                      background: status === s.id ? `${s.color}10` : COLORS.surfaceAlt,
                    }}
                  >
                    <s.icon size={16} style={{ color: status === s.id ? s.color : COLORS.textDim }} />
                    <div>
                      <div className="text-[13px] font-bold" style={{ color: status === s.id ? s.color : COLORS.text }}>
                        {s.label}
                      </div>
                      <div className="text-text-dim text-[11px]">
                        {s.id === 'active' ? 'Can access the shop' : 'Access revoked'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-text-muted mb-2.5 block text-xs font-bold tracking-wide uppercase">
              Role{' '}
              {isOwner && (
                <span className="text-text-dim text-[10px] font-medium normal-case">
                  (Owner role cannot be changed)
                </span>
              )}
            </label>
            <div className="flex flex-col gap-1.5">
              {ROLES.map((r) => {
                const sel = selectedRole === r.id;
                const disabled = isOwner && r.id !== 'owner';
                const locked = isOwner && r.id === 'owner';
                return (
                  <div
                    key={r.id}
                    onClick={() => {
                      if (!isOwner) setSelectedRole(r.id);
                    }}
                    className={clsx(
                      'flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-200',
                      disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                    )}
                    style={{
                      border: `1.5px solid ${sel ? r.color : COLORS.border}`,
                      background: sel ? `${r.color}10` : COLORS.surfaceAlt,
                    }}
                  >
                    <span className="shrink-0 text-xl">{r.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold" style={{ color: sel ? r.color : COLORS.text }}>
                        {r.label}
                      </div>
                      <div className="text-text-dim overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
                        {r.access}
                      </div>
                    </div>
                    {locked ? (
                      <Lock size={14} className="text-text-dim shrink-0" />
                    ) : (
                      <div
                        className="flex size-5 shrink-0 items-center justify-center rounded-full"
                        style={{ border: `2px solid ${sel ? r.color : COLORS.border}` }}
                      >
                        {sel && <div className="size-2.5 rounded-full" style={{ background: r.color }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isOwner && (
            <div className="border-border mt-6 border-t pt-5">
              {!showRemoveConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowRemoveConfirm(true)}
                  className="bg-danger-bg text-danger border-danger/[0.19] flex w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-4 py-2.5 font-[inherit] text-[13px] font-semibold"
                >
                  <Trash2 size={14} /> Remove from Shop
                </button>
              ) : (
                <div className="bg-danger-bg border-danger/[0.19] rounded-xl border-[1.5px] p-4">
                  <div className="mb-3.5 flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-danger mt-px shrink-0" />
                    <div>
                      <div className="text-danger mb-1 text-sm font-bold">Remove {member.name}?</div>
                      <div className="text-text-dim text-xs leading-normal">
                        This will permanently revoke their access. They'll need a new invitation to rejoin.
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRemoveConfirm(false)}
                      className="border-border bg-surface text-text-muted rounded-lg border px-4 py-2 font-[inherit] text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRemove(member.id);
                        onClose();
                      }}
                      className="bg-danger rounded-lg border-none px-4 py-2 font-[inherit] text-xs font-bold text-white"
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-text-muted rounded-[10px] border-[1.5px] bg-transparent px-5 py-2.5 font-[inherit] text-[13px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!changed || saving || isOwner}
            className={clsx(
              'flex items-center gap-1.5 rounded-[10px] border-none px-6 py-2.5 font-[inherit] text-[13px] font-bold',
              changed && !saving && !isOwner ? 'cursor-pointer' : 'cursor-not-allowed',
            )}
            style={{
              background:
                changed && !saving && !isOwner
                  ? `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
                  : COLORS.surfaceAlt,
              color: changed && !saving && !isOwner ? '#fff' : COLORS.textDim,
            }}
          >
            {saving ? (
              <>
                <div
                  className="size-3.5 rounded-full"
                  style={{
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />{' '}
                Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Main TeamPage ----
interface TeamPageProps {
  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
}

export const TeamPage = ({ teamMembers, setTeamMembers }: TeamPageProps) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const { setPage } = useNavigation();
  const { canAdd, showLimitBlock, canAccess } = useShop();
  const canManagePerms = canAccess('team_roles');
  const mobile = isMobile(bp);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [tblPage, setTblPage] = useState(1);

  const filtered = teamMembers.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'active').length,
    pending: teamMembers.filter((m) => m.status === 'pending').length,
    rolesUsed: new Set(teamMembers.map((m) => m.role)).size,
  };

  const handleInvite = (newMember: TeamMember) => {
    setTeamMembers((prev) => [...prev, newMember]);
    setShowInvite(false);
  };

  const handleUpdate = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleRemove = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleStatus = (member: TeamMember) => {
    const next = member.status === 'active' ? 'deactivated' : 'active';
    handleUpdate(member.id, { status: next });
    setActionMenuId(null);
  };

  const statusColors: Record<string, string> = {
    active: COLORS.success,
    pending: '#F59E0B',
    deactivated: COLORS.textDim,
  };

  return (
    <div className="mx-auto max-w-[1100px] p-4 sm:px-7 sm:py-6">
      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-6 sm:grid-cols-4 sm:gap-3.5">
        {[
          { label: 'Total Members', value: stats.total, icon: Users, color: COLORS.primary },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: COLORS.success },
          { label: 'Pending Invites', value: stats.pending, icon: Clock, color: '#F59E0B' },
          { label: 'Roles in Use', value: `${stats.rolesUsed} / ${ROLES.length}`, icon: Shield, color: COLORS.accent },
        ].map((s, i) => (
          <StatCard key={i} {...s} valueFontSize={bp === 'sm' ? 18 : 22} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="text-text-dim absolute top-1/2 left-3.5 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone\u2026"
            className="border-border bg-surface text-text w-full rounded-xl border-[1.5px] py-[11px] pr-3.5 pl-10 font-[inherit] text-[13px] outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="border-border flex overflow-hidden rounded-[10px] border">
            {['all', 'active', 'pending', 'deactivated'].map((s) => (
              <TabButton
                key={s}
                active={statusFilter === s}
                variant="segment"
                onClick={() => setStatusFilter(s)}
                style={{
                  borderRight: s !== 'deactivated' ? `1px solid ${COLORS.border}` : 'none',
                }}
              >
                {s === 'all' ? 'All' : s}
              </TabButton>
            ))}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={clsx(
              'border-border bg-surface cursor-pointer rounded-[10px] border px-3 py-[9px] font-[inherit] text-xs font-semibold outline-none',
              roleFilter === 'all' ? 'text-text-muted' : 'text-text',
            )}
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.icon} {r.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (canAdd && !canAdd('team')) {
                showLimitBlock && showLimitBlock('Team Members');
                return;
              }
              setShowInvite(true);
            }}
            className="flex items-center gap-1.5 rounded-[10px] border-none px-[18px] py-[9px] font-[inherit] text-[13px] font-bold whitespace-nowrap text-white"
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
              boxShadow: `0 4px 16px ${COLORS.primary}35`,
            }}
          >
            <UserPlus size={15} /> Invite
          </button>
          {canManagePerms && (
            <button
              type="button"
              onClick={() => setPage('permissions')}
              className="border-border bg-surface text-text-muted flex items-center gap-1.5 rounded-[10px] border-[1.5px] px-3.5 py-[9px] font-[inherit] text-xs font-semibold whitespace-nowrap"
            >
              <Shield size={14} /> {!mobile && 'Permissions'}
            </button>
          )}
        </div>
      </div>

      {/* Table / Cards */}
      {filtered.length === 0 ? (
        <div className="px-5 py-[60px] text-center">
          <Users size={40} className="text-text-dim mb-3" />
          <div className="text-text-muted mb-1.5 text-[15px] font-semibold">No members found</div>
          <div className="text-text-dim text-[13px]">Try adjusting your search or filters.</div>
        </div>
      ) : mobile ? (
        (() => {
          const pgd = paginate(filtered, tblPage, 8);
          return (
            <div className="flex flex-col gap-2.5">
              {pgd.items.map((member: TeamMember) => {
                const role = getRoleMeta(member.role);
                return (
                  <div
                    key={member.id}
                    onClick={() => setEditingMember(member)}
                    className="bg-surface border-border cursor-pointer rounded-[14px] border p-4 transition-all duration-150"
                  >
                    <div className="mb-2.5 flex items-center gap-3">
                      <div
                        className="flex size-[44px] shrink-0 items-center justify-center rounded-xl text-[15px] font-extrabold"
                        style={{
                          background: `linear-gradient(135deg, ${role.color}40, ${role.color}20)`,
                          color: role.color,
                          border: `2px solid ${role.color}25`,
                        }}
                      >
                        {member.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-text text-sm font-bold">{member.name}</div>
                        <div className="text-text-dim overflow-hidden text-xs text-ellipsis whitespace-nowrap">
                          {member.email}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-text-dim shrink-0" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className="rounded-[20px] px-2.5 py-[3px] text-[11px] font-bold"
                        style={{
                          background: `${role.color}12`,
                          color: role.color,
                          border: `1px solid ${role.color}25`,
                        }}
                      >
                        {role.icon} {role.label}
                      </span>
                      <span
                        className="rounded-[20px] px-2.5 py-[3px] text-[11px] font-semibold capitalize"
                        style={{
                          background: `${statusColors[member.status]}12`,
                          color: statusColors[member.status],
                          border: `1px solid ${statusColors[member.status]}25`,
                        }}
                      >
                        {member.status}
                      </span>
                      <span className="bg-surface-alt text-text-dim rounded-[20px] px-2.5 py-[3px] text-[11px] font-medium">
                        <Clock size={9} className="mr-[3px] align-middle" />
                        {member.lastActive}
                      </span>
                    </div>
                  </div>
                );
              })}
              <Paginator {...pgd} perPage={8} onPage={(v: number) => setTblPage(v)} />
            </div>
          );
        })()
      ) : (
        (() => {
          const pgd = paginate(filtered, tblPage, 10);
          return (
            <div className="border-border bg-surface overflow-hidden rounded-[14px] border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-border border-b">
                    {['Member', 'Phone', 'Role', 'Status', 'Last Active', ''].map((h, i) => (
                      <th
                        key={i}
                        className="text-text-dim bg-surface-alt px-4 py-[13px] text-left text-[11px] font-bold tracking-[0.5px] uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pgd.items.map((member: TeamMember) => {
                    const role = getRoleMeta(member.role);
                    return (
                      <tr key={member.id} className="border-border hover:bg-surface-alt border-b transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold"
                              style={{
                                background: `linear-gradient(135deg, ${role.color}40, ${role.color}20)`,
                                color: role.color,
                                border: `2px solid ${role.color}25`,
                              }}
                            >
                              {member.avatar}
                            </div>
                            <div>
                              <div className="text-text text-sm font-bold">{member.name}</div>
                              <div className="text-text-dim text-xs">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-text-muted px-4 py-3 font-mono text-[13px]">{member.phone}</td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-[20px] px-3 py-1 text-xs font-bold whitespace-nowrap"
                            style={{
                              background: `${role.color}12`,
                              color: role.color,
                              border: `1px solid ${role.color}25`,
                            }}
                          >
                            {role.icon} {role.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="rounded-[20px] px-3 py-1 text-xs font-semibold capitalize"
                            style={{
                              background: `${statusColors[member.status]}12`,
                              color: statusColors[member.status],
                              border: `1px solid ${statusColors[member.status]}25`,
                            }}
                          >
                            {member.status === 'active' && '\u25CF '}
                            {member.status}
                          </span>
                        </td>
                        <td className="text-text-dim px-4 py-3 text-xs">{member.lastActive}</td>
                        <td className="relative px-4 py-3">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(actionMenuId === member.id ? null : member.id);
                            }}
                            className="text-text-dim flex size-8 cursor-pointer items-center justify-center rounded-lg transition-[background] duration-150"
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) =>
                              (e.currentTarget.style.background = COLORS.surfaceAlt)
                            }
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                              if (actionMenuId !== member.id) e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <MoreVertical size={16} />
                          </div>
                          {actionMenuId === member.id && (
                            <div
                              className="bg-surface border-border absolute top-full right-4 z-[100] min-w-[180px] rounded-xl border p-1.5"
                              style={{
                                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                                animation: 'modalIn 0.15s ease',
                              }}
                            >
                              <div
                                onClick={() => {
                                  setEditingMember(member);
                                  setActionMenuId(null);
                                }}
                                className="text-text hover:bg-surface-alt flex cursor-pointer items-center gap-2 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors"
                              >
                                <Edit size={14} className="text-text-dim" /> Edit Member
                              </div>
                              {member.role !== 'owner' && (
                                <>
                                  <div
                                    onClick={() => handleToggleStatus(member)}
                                    className="text-text hover:bg-surface-alt flex cursor-pointer items-center gap-2 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors"
                                  >
                                    {member.status === 'active' ? (
                                      <>
                                        <UserMinus size={14} className="text-text-dim" /> Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle size={14} className="text-success" /> Activate
                                      </>
                                    )}
                                  </div>
                                  <div className="bg-border mx-2 my-1 h-px" />
                                  <div
                                    onClick={() => {
                                      handleRemove(member.id);
                                      setActionMenuId(null);
                                    }}
                                    className="text-danger hover:bg-danger-bg flex cursor-pointer items-center gap-2 rounded-lg px-3 py-[9px] text-[13px] font-medium transition-colors"
                                  >
                                    <Trash2 size={14} /> Remove
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="border-border border-t px-4">
                <Paginator {...pgd} perPage={10} onPage={(v: number) => setTblPage(v)} />
              </div>
            </div>
          );
        })()
      )}

      {/* Summary footer */}
      <div className="text-text-dim mt-1 flex items-center justify-end text-xs">
        <div className="flex flex-wrap gap-1">
          {ROLES.filter((r) => teamMembers.some((m) => m.role === r.id)).map((r) => (
            <span
              key={r.id}
              className="rounded-xl px-2 py-0.5 text-[10px] font-semibold"
              style={{
                background: `${r.color}10`,
                color: r.color,
                border: `1px solid ${r.color}20`,
              }}
            >
              {r.icon} {teamMembers.filter((m) => m.role === r.id).length}
            </span>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showInvite && <InviteMemberModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
};
