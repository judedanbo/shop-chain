import { useState } from 'react';
import {
  Shield,
  Search,
  Plus,
  ArrowLeft,
  Save,
  Ban,
  RefreshCw,
  Trash2,
  X,
  Mail,
  Phone,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import type { AdminTeamMember, AdminRoleId } from '@/types/admin.types';
import { MOCK_ADMIN_TEAM, ADMIN_ROLES, PERMISSION_LABELS } from '@/constants/adminData';
import type { AdminThemeColors } from '@/constants/adminThemes';

const CURRENT_ADMIN_ID = 'adm1'; // Jude Appiah

interface AdminTeamTabProps {
  C: AdminThemeColors;
}

const ROLE_IDS = Object.keys(ADMIN_ROLES) as AdminRoleId[];

export function AdminTeamTab({ C }: AdminTeamTabProps) {
  const [teamMembers, setTeamMembers] = useState<AdminTeamMember[]>(MOCK_ADMIN_TEAM);
  const [selectedMember, setSelectedMember] = useState<AdminTeamMember | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form state
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invRole, setInvRole] = useState<AdminRoleId>('support_agent');
  const [invMessage, setInvMessage] = useState('');

  // ─── Helpers ──────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      active: { bg: `${C.success}38`, color: C.success ?? '' },
      invited: { bg: `${C.warning}38`, color: C.warning ?? '' },
      suspended: { bg: `${C.danger}38`, color: C.danger ?? '' },
    };
    const s = map[status] ?? map.active!;
    return (
      <span
        className="rounded-[5px] px-2 py-[2px] text-[10px] font-bold capitalize"
        style={{ background: s.bg, color: s.color }}
      >
        {status}
      </span>
    );
  };

  const roleBadge = (roleId: AdminRoleId) => {
    const r = ADMIN_ROLES[roleId];
    return (
      <span
        className="rounded-[5px] px-2 py-[2px] text-[10px] font-bold"
        style={{ background: `${r.color}35`, color: r.color }}
      >
        {r.icon} {r.label}
      </span>
    );
  };

  const inputCls = 'w-full rounded-[10px] px-3.5 py-2.5 text-[13px] font-[inherit] outline-none box-border';
  const labelCls = 'text-[11px] font-bold uppercase tracking-[0.5px] mb-1 block';

  // ─── KPI counts ────────────────────────────────────────────────
  const totalCount = teamMembers.length;
  const activeCount = teamMembers.filter((m) => m.status === 'active').length;
  const invitedCount = teamMembers.filter((m) => m.status === 'invited').length;
  const suspendedCount = teamMembers.filter((m) => m.status === 'suspended').length;

  const kpis = [
    { label: 'Total Admins', value: totalCount, color: C.primary },
    { label: 'Active', value: activeCount, color: C.success },
    { label: 'Invited', value: invitedCount, color: C.warning },
    { label: 'Suspended', value: suspendedCount, color: C.danger },
  ];

  // ─── Member Detail View ────────────────────────────────────────
  if (selectedMember) {
    const activities = [
      { text: 'Logged in from Accra, GH', time: '2 hours ago' },
      { text: 'Changed user status', time: '1 day ago' },
      { text: 'Viewed audit log', time: '3 days ago' },
    ];

    const handleSave = () => {
      setTeamMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? { ...selectedMember } : m)));
      setSelectedMember(null);
    };
    const handleToggleSuspend = () => {
      const next: AdminTeamMember = {
        ...selectedMember,
        status: selectedMember.status === 'suspended' ? 'active' : 'suspended',
      };
      setSelectedMember(next);
      setTeamMembers((prev) => prev.map((m) => (m.id === next.id ? next : m)));
    };
    const handleRemove = () => {
      setTeamMembers((prev) => prev.filter((m) => m.id !== selectedMember.id));
      setSelectedMember(null);
    };

    const isSelf = selectedMember.id === CURRENT_ADMIN_ID;
    const superAdminCount = teamMembers.filter((m) => m.role === 'super_admin' && m.status === 'active').length;
    const isLastSuperAdmin = selectedMember.role === 'super_admin' && superAdminCount <= 1;
    const isProtected = isSelf || isLastSuperAdmin;

    return (
      <div>
        {/* Back button */}
        <button
          type="button"
          onClick={() => setSelectedMember(null)}
          className="text-primary mb-[18px] flex items-center gap-1.5 border-none bg-transparent p-0 text-[13px] font-bold"
        >
          <ArrowLeft size={15} /> Back to Team
        </button>

        {/* Header card */}
        <div className="bg-surface border-border mb-[18px] rounded-[14px] border-[1.5px] p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-primary/[0.08] text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-extrabold">
              {selectedMember.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-text m-0 text-lg font-extrabold">{selectedMember.name}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-text-muted flex items-center gap-1 text-xs">
                  <Mail size={12} /> {selectedMember.email}
                </span>
                <span className="text-text-muted flex items-center gap-1 text-xs">
                  <Phone size={12} /> {selectedMember.phone}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {roleBadge(selectedMember.role)}
                {statusBadge(selectedMember.status)}
              </div>
            </div>
          </div>
        </div>

        {/* Role Assignment */}
        <div className="bg-surface border-border mb-[18px] rounded-[14px] border-[1.5px] p-5">
          <h3 className="text-text m-0 mb-3.5 text-[15px] font-extrabold">
            <Shield size={15} className="mr-1.5 align-[-2px]" />
            Role Assignment
          </h3>
          {isSelf && (
            <div className="text-warning border-warning/[0.19] bg-warning/[0.07] mb-3.5 flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-xs font-semibold">
              <AlertTriangle size={14} /> You cannot change your own role.
            </div>
          )}
          {isLastSuperAdmin && !isSelf && (
            <div className="text-danger border-danger/[0.19] bg-danger/[0.07] mb-3.5 flex items-center gap-2 rounded-[10px] border px-3.5 py-2.5 text-xs font-semibold">
              <AlertTriangle size={14} /> This is the last Super Admin. Their role cannot be changed or removed.
            </div>
          )}
          <div
            className={clsx(
              'grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
              isProtected && 'pointer-events-none opacity-50',
            )}
          >
            {ROLE_IDS.map((rid) => {
              const r = ADMIN_ROLES[rid];
              const isActive = selectedMember.role === rid;
              return (
                <div
                  key={rid}
                  onClick={() => !isProtected && setSelectedMember({ ...selectedMember, role: rid })}
                  className="rounded-[10px] p-3 transition-all duration-150"
                  style={{
                    cursor: isProtected ? 'not-allowed' : 'pointer',
                    border: `2px solid ${isActive ? r.color : C.border}`,
                    background: isActive ? r.color + '10' : C.surface,
                  }}
                >
                  <div className="mb-1.5 text-[22px]">{r.icon}</div>
                  <div className="text-[13px] font-bold" style={{ color: isActive ? r.color : C.text }}>
                    {r.label}
                  </div>
                  <div className="text-text-muted mt-1 text-[11px] leading-snug">{r.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="bg-surface border-border mb-[18px] rounded-[14px] border-[1.5px] p-5">
          <h3 className="text-text m-0 mb-3.5 text-[15px] font-extrabold">Permission Matrix</h3>
          {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
            const granted = ADMIN_ROLES[selectedMember.role].permissions[key] ?? false;
            return (
              <div key={key} className="border-border flex items-center justify-between border-b py-2">
                <span className="text-text text-[13px]">{label}</span>
                <span className="text-[13px] font-bold" style={{ color: granted ? C.success : C.danger }}>
                  {granted ? '\u2713' : '\u2717'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-surface border-border mb-[18px] rounded-[14px] border-[1.5px] p-5">
          <h3 className="text-text m-0 mb-3.5 text-[15px] font-extrabold">
            <Clock size={15} className="mr-1.5 align-[-2px]" />
            Recent Activity
          </h3>
          {activities.map((a, i) => (
            <div
              key={i}
              className="flex justify-between py-2"
              style={{
                borderBottom: i < activities.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <span className="text-text text-[13px]">{a.text}</span>
              <span className="text-text-dim text-[11px]">{a.time}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            className="bg-primary flex items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13px] font-bold text-white"
          >
            <Save size={14} /> Save Changes
          </button>
          <button
            type="button"
            onClick={isProtected ? undefined : handleToggleSuspend}
            disabled={isProtected}
            className={clsx(
              'flex items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13px] font-bold',
              isProtected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
            )}
            style={{
              background: selectedMember.status === 'suspended' ? `${C.success}15` : `${C.warning}15`,
              color: selectedMember.status === 'suspended' ? C.success : C.warning,
            }}
          >
            {selectedMember.status === 'suspended' ? (
              <>
                <RefreshCw size={14} /> Reactivate
              </>
            ) : (
              <>
                <Ban size={14} /> Suspend
              </>
            )}
          </button>
          <button
            type="button"
            onClick={isProtected ? undefined : handleRemove}
            disabled={isProtected}
            className={clsx(
              'text-danger bg-danger/[0.08] flex items-center gap-1.5 rounded-[10px] border-none px-5 py-2.5 text-[13px] font-bold',
              isProtected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
            )}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    );
  }

  // ─── Team List View ────────────────────────────────────────────
  const q = search.toLowerCase();
  const filtered = teamMembers.filter((m) => {
    if (filterRole !== 'all' && m.role !== filterRole) return false;
    if (q && !m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q)) return false;
    return true;
  });

  const resetInviteForm = () => {
    setInvName('');
    setInvEmail('');
    setInvPhone('');
    setInvRole('support_agent');
    setInvMessage('');
  };

  const handleSendInvite = () => {
    if (!invName.trim() || !invEmail.trim()) return;
    const initials = invName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const newMember: AdminTeamMember = {
      id: `adm-${Date.now()}`,
      name: invName.trim(),
      email: invEmail.trim(),
      phone: invPhone.trim(),
      role: invRole,
      avatar: initials,
      status: 'invited',
      twoFA: false,
      lastLogin: null,
    };
    setTeamMembers((prev) => [...prev, newMember]);
    resetInviteForm();
    setShowInviteModal(false);
  };

  return (
    <div>
      {/* KPI Cards */}
      <div className="mb-[18px] grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-surface border-border rounded-[14px] border-[1.5px] p-4 text-center">
            <div className="text-[22px] font-extrabold" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="text-text-muted mt-0.5 text-[11px] font-semibold">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Role Breakdown */}
      <div className="mb-[18px] flex flex-wrap gap-2">
        {ROLE_IDS.map((rid) => {
          const r = ADMIN_ROLES[rid];
          const count = teamMembers.filter((m) => m.role === rid).length;
          return (
            <span
              key={rid}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-[5px] text-xs font-bold"
              style={{ background: r.color + '15', color: r.color }}
            >
              {r.icon} {r.label} <span className="font-extrabold">{count}</span>
            </span>
          );
        })}
      </div>

      {/* Search + Filter + Invite */}
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="text-text-dim absolute top-1/2 left-2.5 -translate-y-1/2" />
          <input
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface text-text box-border w-full rounded-[10px] py-2 pr-2.5 pl-8 font-[inherit] text-[13px] outline-none"
            style={{
              border: `1.5px solid ${C.border}`,
            }}
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-surface text-text rounded-[10px] px-3 py-2 font-[inherit] text-[13px] outline-none"
          style={{
            border: `1.5px solid ${C.border}`,
          }}
        >
          <option value="all">All Roles</option>
          {ROLE_IDS.map((rid) => (
            <option key={rid} value={rid}>
              {ADMIN_ROLES[rid].label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            resetInviteForm();
            setShowInviteModal(true);
          }}
          className="bg-primary-bg text-primary flex items-center gap-1.5 rounded-[10px] border-none px-4 py-2 text-[13px] font-bold"
        >
          <Plus size={15} /> Invite Admin
        </button>
      </div>

      {/* Team Table */}
      <div className="bg-surface border-border overflow-hidden rounded-[14px] border-[1.5px]">
        {/* Header row */}
        <div
          className="form-label bg-surface-alt text-text-muted border-b-border grid border-b-[1.5px] px-4 py-2.5 tracking-[0.5px]"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 80px 140px',
          }}
        >
          <span>Member</span>
          <span>Role</span>
          <span>Status</span>
          <span>2FA</span>
          <span>Last Login</span>
        </div>
        {filtered.length === 0 && (
          <div className="text-text-dim p-8 text-center text-[13px]">No team members found.</div>
        )}
        {filtered.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelectedMember(m)}
            className="border-border hover:bg-surface-alt grid cursor-pointer items-center border-b px-4 py-3 transition-[background] duration-[120ms]"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr 80px 140px',
            }}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-primary/[0.08] text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold">
                {m.avatar}
              </div>
              <div className="min-w-0">
                <div className="text-text overflow-hidden text-[13px] font-bold text-ellipsis whitespace-nowrap">
                  {m.name}
                </div>
                <div className="text-text-dim overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
                  {m.email}
                </div>
              </div>
            </div>
            <div>{roleBadge(m.role)}</div>
            <div>{statusBadge(m.status)}</div>
            <div>
              <span className="text-xs font-bold" style={{ color: m.twoFA ? C.success : C.danger }}>
                {m.twoFA ? '\u2713' : '\u2717'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-text-dim text-[11px]">{m.lastLogin ?? '\u2014'}</span>
              {m.status === 'invited' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="text-primary border-primary/[0.25] bg-primary/[0.06] flex items-center gap-1 rounded-md border px-2 py-[3px] font-[inherit] text-[10px] font-bold whitespace-nowrap"
                >
                  <RefreshCw size={10} /> Resend
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Admin Modal */}
      {showInviteModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="bg-surface border-border relative w-full max-w-[480px] rounded-[18px] border-[1.5px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              aria-label="Close"
              className="text-text-muted absolute top-4 right-4 border-none bg-transparent p-0"
            >
              <X size={18} />
            </button>

            <h3 className="text-text m-0 mb-5 text-[17px] font-extrabold">Invite New Admin</h3>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className={`${labelCls} text-text-muted`}>Name</label>
                <input
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  className={`${inputCls} bg-surface-alt text-text`}
                  style={{
                    border: `1.5px solid ${C.border}`,
                  }}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={`${labelCls} text-text-muted`}>Email</label>
                <input
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  className={`${inputCls} bg-surface-alt text-text`}
                  style={{
                    border: `1.5px solid ${C.border}`,
                  }}
                  placeholder="admin@example.com"
                  type="email"
                />
              </div>
              <div>
                <label className={`${labelCls} text-text-muted`}>Phone</label>
                <input
                  value={invPhone}
                  onChange={(e) => setInvPhone(e.target.value)}
                  className={`${inputCls} bg-surface-alt text-text`}
                  style={{
                    border: `1.5px solid ${C.border}`,
                  }}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <div>
                <label className={`${labelCls} text-text-muted`}>Role</label>
                <select
                  value={invRole}
                  onChange={(e) => setInvRole(e.target.value as AdminRoleId)}
                  className={`${inputCls} bg-surface-alt text-text`}
                  style={{
                    border: `1.5px solid ${C.border}`,
                  }}
                >
                  {ROLE_IDS.map((rid) => (
                    <option key={rid} value={rid} disabled={rid === 'super_admin'}>
                      {ADMIN_ROLES[rid].icon} {ADMIN_ROLES[rid].label}
                      {rid === 'super_admin' ? ' (Requires Super Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`${labelCls} text-text-muted`}>Welcome Message</label>
                <textarea
                  value={invMessage}
                  onChange={(e) => setInvMessage(e.target.value)}
                  rows={3}
                  className={`${inputCls} bg-surface-alt text-text resize-y`}
                  style={{
                    border: `1.5px solid ${C.border}`,
                  }}
                  placeholder="Optional welcome message..."
                />
              </div>
            </div>

            <div className="mt-[22px] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="bg-surface-alt text-text-muted rounded-[10px] px-5 py-[9px] text-[13px] font-bold"
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                className="bg-primary rounded-[10px] border-none px-5 py-[9px] text-[13px] font-bold text-white"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
