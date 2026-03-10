import { useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  Eye,
  FileText,
  Activity,
  Copy,
  Flag,
  X,
  Plus,
  Clock,
  MapPin,
  Monitor,
  User,
} from 'lucide-react';
import type { Investigation, Anomaly, DetectionRule, InvestigationStatus } from '@/types/admin.types';
import { TabButton } from '@/components/ui';
import {
  AUDIT_CATEGORIES,
  AUDIT_RISK_LEVELS,
  MOCK_AUDIT_LOG,
  MOCK_INVESTIGATIONS,
  MOCK_ANOMALIES,
  AUDIT_DETECTION_RULES,
  MOCK_USER_FORENSIC_LOGINS,
  MOCK_HEATMAP,
  MOCK_BEHAVIORAL_FLAGS,
  FLAG_COLORS,
} from '@/constants/adminAuditData';
import { ADMIN_DEMO_USERS } from '@/constants/adminData';
import type { AdminThemeColors } from '@/constants/adminThemes';

// ─── Props ───────────────────────────────────────────────────
interface AdminAuditFraudTabProps {
  C: AdminThemeColors;
}

// ─── Types ───────────────────────────────────────────────────
type SubTab = 'activityLog' | 'investigations' | 'anomalies' | 'forensics' | 'reports';
type LogCategory = 'all' | 'auth' | 'financial' | 'data' | 'admin' | 'system';
type LogRisk = 'all' | 'low' | 'medium' | 'high' | 'critical';
type LogPeriod = '24h' | '7d' | '30d' | '90d';
type ForensicFilter = 'all' | 'frontend' | 'admin' | 'flagged';

const SUB_TAB_LABELS: { key: SubTab; label: string }[] = [
  { key: 'activityLog', label: 'Activity Log' },
  { key: 'investigations', label: 'Investigations' },
  { key: 'anomalies', label: 'Anomalies' },
  { key: 'forensics', label: 'Forensics' },
  { key: 'reports', label: 'Reports' },
];

const PERIOD_OPTIONS: LogPeriod[] = ['24h', '7d', '30d', '90d'];

// ─── Helpers ─────────────────────────────────────────────────
function riskLevelFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'medium';
  return 'low';
}

function riskColor(score: number): string {
  const rl = riskLevelFromScore(score);
  return AUDIT_RISK_LEVELS[rl].color;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#3B82F6',
  in_progress: '#F59E0B',
  escalated: '#EF4444',
  closed: '#10B981',
  reviewing: '#F59E0B',
  resolved: '#10B981',
  dismissed: '#6B7280',
};
const statusColor = (s: string) => STATUS_COLORS[s] ?? '#6B7280';
const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#9333EA',
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};
const priorityColor = (p: string) => PRIORITY_COLORS[p] ?? '#6B7280';

// ─── Component ───────────────────────────────────────────────
export function AdminAuditFraudTab({ C }: AdminAuditFraudTabProps) {
  // Sub-tab
  const [subTab, setSubTab] = useState<SubTab>('activityLog');

  // Activity Log state
  const [logSearch, setLogSearch] = useState('');
  const [logCategory, setLogCategory] = useState<LogCategory>('all');
  const [logRisk, setLogRisk] = useState<LogRisk>('all');
  const [logPeriod, setLogPeriod] = useState<LogPeriod>('7d');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  // Investigation state
  const [investigations, setInvestigations] = useState<Investigation[]>(MOCK_INVESTIGATIONS);
  const [selectedCase, setSelectedCase] = useState<Investigation | null>(null);
  const [showCreateCase, setShowCreateCase] = useState(false);

  // Anomaly state
  const [anomalies, setAnomalies] = useState<Anomaly[]>(MOCK_ANOMALIES);
  const [detectionRules, setDetectionRules] = useState<DetectionRule[]>(AUDIT_DETECTION_RULES);

  // Forensics state
  const [forensicFilter, setForensicFilter] = useState<ForensicFilter>('all');
  const [forensicSearch, setForensicSearch] = useState('');
  const [selectedForensicUser, setSelectedForensicUser] = useState<string | null>(null);
  const [forensicSort, setForensicSort] = useState<'default' | 'risk_desc' | 'risk_asc'>('default');

  // Create case form state
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDesc, setNewCaseDesc] = useState('');
  const [newCasePriority, setNewCasePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newCaseAssignee, setNewCaseAssignee] = useState('Jude Mensah');

  // Report state
  const [reportCaseId, setReportCaseId] = useState('');

  // ─── Shared style tokens ────────────────────────────────────
  const cardCls = 'bg-surface p-5 rounded-[14px]';
  const cardStyle: React.CSSProperties = {
    border: `1.5px solid ${C.border}`,
  };
  const sectionTitleCls = 'text-sm font-bold mb-3.5 text-text';
  const inputCls = 'w-full rounded-lg text-[13px] outline-none bg-surface-alt text-text border border-border px-3 py-2';
  const selectCls =
    'w-full rounded-lg text-[13px] outline-none appearance-none cursor-pointer bg-surface-alt text-text border border-border pr-7';
  const btnPrimaryCls =
    'rounded-lg border-none cursor-pointer font-semibold text-[13px] text-white bg-primary px-4 py-2';
  const btnOutlineCls =
    'rounded-lg cursor-pointer font-semibold bg-transparent text-text border border-border px-4 py-2';
  const codeBlockCls = 'p-3 text-[11px] overflow-auto';
  const codeBlockStyle: React.CSSProperties = {
    maxHeight: 120,
  };
  const badgeCls = 'inline-block px-2 py-0.5 text-[11px] font-semibold';
  const badge = (bg: string, fg?: string): React.CSSProperties => ({
    background: bg + '18',
    color: fg ?? bg,
  });

  // ─── Filtered audit log ────────────────────────────────────
  const filteredLog = useMemo(() => {
    let events = [...MOCK_AUDIT_LOG];
    if (logCategory !== 'all') events = events.filter((e) => e.cat === logCategory);
    if (logRisk !== 'all') {
      const rl = AUDIT_RISK_LEVELS[logRisk];
      events = events.filter((e) => e.risk >= rl.min && e.risk <= rl.max);
    }
    if (logSearch) {
      const q = logSearch.toLowerCase();
      events = events.filter(
        (e) =>
          e.action.toLowerCase().includes(q) || e.actor.toLowerCase().includes(q) || e.target.toLowerCase().includes(q),
      );
    }
    return events;
  }, [logCategory, logRisk, logSearch]);

  // ─── Investigation KPI counts ──────────────────────────────
  const invCounts = useMemo(() => {
    const c = { open: 0, in_progress: 0, escalated: 0, closed: 0 };
    investigations.forEach((inv) => {
      c[inv.status]++;
    });
    return c;
  }, [investigations]);

  // ─── Anomaly severity counts ──────────────────────────────
  const anomalyCounts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    anomalies.forEach((a) => {
      c[a.severity]++;
    });
    return c;
  }, [anomalies]);

  // ─── Forensic users with mock risk ─────────────────────────
  const forensicUsers = useMemo(() => {
    return ADMIN_DEMO_USERS.map((u, i) => ({
      ...u,
      riskScore: Math.min(100, i * 12 + 15),
      has2FA: i % 3 === 0,
    }));
  }, []);

  const filteredForensicUsers = useMemo(() => {
    let users = [...forensicUsers];
    if (forensicFilter === 'frontend') users = users.filter((u) => u.plan !== 'max');
    if (forensicFilter === 'admin') users = users.filter((u) => u.plan === 'max');
    if (forensicFilter === 'flagged') users = users.filter((u) => u.riskScore > 50);
    if (forensicSearch) {
      const q = forensicSearch.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (forensicSort === 'risk_desc') users.sort((a, b) => b.riskScore - a.riskScore);
    if (forensicSort === 'risk_asc') users.sort((a, b) => a.riskScore - b.riskScore);
    return users;
  }, [forensicUsers, forensicFilter, forensicSearch, forensicSort]);

  // ─── Report case ──────────────────────────────────────────
  const reportCase = useMemo(() => {
    return investigations.find((inv) => inv.id === reportCaseId) ?? null;
  }, [investigations, reportCaseId]);

  const ToggleSwitch = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <div
      onClick={onToggle}
      className="relative h-6 w-[44px] shrink-0 cursor-pointer rounded-[12px] transition-[background] duration-200"
      style={{
        background: on ? C.primary : C.border,
      }}
    >
      <div
        className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
        style={{
          transform: on ? 'translateX(20px)' : 'translateX(0)',
        }}
      />
    </div>
  );

  const KpiCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
    <div className={`${cardCls} text-center`} style={cardStyle}>
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-text-dim mt-1 text-xs">{label}</div>
    </div>
  );

  // ─── Sub-tab 1: Activity Log ─────────────────────────────
  const renderActivityLog = () => (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[160px]" style={{ flex: '1 1 180px' }}>
          <Search size={14} color={C.textDim} className="absolute top-2.5 left-2.5" />
          <input
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search events..."
            className={`${inputCls} pl-8`}
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={logCategory}
            onChange={(e) => setLogCategory(e.target.value as LogCategory)}
            className={selectCls}
          >
            <option value="all">All Categories</option>
            {Object.entries(AUDIT_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} color={C.textDim} className="pointer-events-none absolute top-2.5 right-2" />
        </div>
        <div className="relative shrink-0">
          <select value={logRisk} onChange={(e) => setLogRisk(e.target.value as LogRisk)} className={selectCls}>
            <option value="all">All Risk Levels</option>
            {Object.entries(AUDIT_RISK_LEVELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} color={C.textDim} className="pointer-events-none absolute top-2.5 right-2" />
        </div>
        <div className="bg-surface-alt flex gap-1 rounded-lg p-[3px]">
          {PERIOD_OPTIONS.map((p) => (
            /* Admin theme override — C.textDim comes from ADMIN_THEMES, not useColors() */
            <TabButton
              key={p}
              active={logPeriod === p}
              variant="pill"
              activeColor={C.primary}
              onClick={() => setLogPeriod(p)}
              style={{
                ...(logPeriod !== p && { color: C.textDim }),
              }}
            >
              {p}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="overflow-hidden rounded-[14px]" style={cardStyle}>
        {filteredLog.length === 0 ? (
          <div className="text-text-dim p-10 text-center text-[13px]">No events match your filters.</div>
        ) : (
          filteredLog.map((event) => {
            const isExpanded = expandedEvent === event.id;
            const catDef = AUDIT_CATEGORIES[event.cat];
            const rlevel = riskLevelFromScore(event.risk);
            const rlDef = AUDIT_RISK_LEVELS[rlevel];
            return (
              <div key={event.id}>
                <div
                  onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2.5 px-4 py-3 transition-[background] duration-150',
                    isExpanded && 'bg-surface-alt',
                  )}
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <span className="w-6 shrink-0 text-center text-base">{catDef.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-text text-[13px] font-semibold">{event.action}</span>
                      <span className="text-text-dim text-[11px]">{event.actor}</span>
                    </div>
                    <div className="text-text-dim mt-0.5 text-[11px]">
                      {event.target} &middot; {event.ts}
                    </div>
                  </div>
                  <span className={`rounded-[6px] ${badgeCls}`} style={badge(rlDef.color)}>
                    {rlDef.label} ({event.risk})
                  </span>
                  <span className="text-text-dim hidden text-[11px] sm:inline">
                    <MapPin size={10} className="mr-[3px]" />
                    {event.location}
                  </span>
                  {isExpanded ? (
                    <ChevronDown size={16} color={C.textDim} />
                  ) : (
                    <ChevronRight size={16} color={C.textDim} />
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="bg-surface-alt border-border border-b p-4">
                    {/* Session Info */}
                    <div className="mb-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { icon: Monitor, label: 'IP', value: event.ip },
                        { icon: Monitor, label: 'Device', value: event.device },
                        { icon: Activity, label: 'Session', value: event.session ?? 'N/A' },
                        { icon: MapPin, label: 'Location', value: event.location },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <item.icon size={12} color={C.textDim} />
                          <span className="text-text-dim text-[11px]">{item.label}:</span>
                          <span className="text-text text-[11px] font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Before / After */}
                    {(event.before || event.after) && (
                      <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-text-dim mb-1 text-[11px] font-semibold">Before</div>
                          <div
                            className={`bg-surface-alt text-text rounded-lg font-mono whitespace-pre-wrap ${codeBlockCls}`}
                            style={codeBlockStyle}
                          >
                            {event.before ? JSON.stringify(event.before, null, 2) : 'null'}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-dim mb-1 text-[11px] font-semibold">After</div>
                          <div
                            className={`bg-surface-alt text-text rounded-lg font-mono whitespace-pre-wrap ${codeBlockCls}`}
                            style={codeBlockStyle}
                          >
                            {event.after ? JSON.stringify(event.after, null, 2) : 'null'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Risk Score Bar */}
                    <div className="mb-3.5">
                      <div className="text-text-dim mb-1.5 text-[11px] font-semibold">Risk Score: {event.risk}/100</div>
                      <div
                        className="relative h-2 overflow-visible rounded"
                        style={{
                          background: `linear-gradient(to right, #10B981, #F59E0B 50%, #EF4444)`,
                        }}
                      >
                        <div
                          className="absolute h-3.5 w-3.5 rounded-full"
                          style={{
                            top: -3,
                            left: `${event.risk}%`,
                            background: riskColor(event.risk),
                            border: '2px solid #fff',
                            transform: 'translateX(-7px)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`${btnOutlineCls} text-[13px]`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Flag size={12} className="mr-1" /> Flag for Investigation
                      </button>
                      <button
                        type="button"
                        className={`${btnOutlineCls} text-[13px]`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard?.writeText(event.id);
                        }}
                      >
                        <Copy size={12} className="mr-1" /> Copy Event ID
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="text-text-dim text-right text-xs">
        Showing {filteredLog.length} of {MOCK_AUDIT_LOG.length} events
      </div>
    </div>
  );

  // ─── Sub-tab 2: Investigations ───────────────────────────
  const renderInvestigations = () => {
    // ─── Case Detail View ────────────────────────────────────
    if (selectedCase) {
      const sc = selectedCase;
      return (
        <div className="flex flex-col gap-4">
          {/* Back */}
          <div
            onClick={() => setSelectedCase(null)}
            className="text-primary flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold"
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to cases
          </div>

          {/* Header */}
          <div className={`${cardCls} flex flex-wrap items-center gap-3`} style={cardStyle}>
            <div className="min-w-[200px] flex-1">
              <div className="text-text text-base font-bold">{sc.title}</div>
              <div className="text-text-dim mt-0.5 text-xs">
                {sc.id} &middot; Created {sc.created}
              </div>
            </div>
            <div className="relative">
              <select
                value={sc.status}
                onChange={(e) => {
                  const ns = e.target.value as InvestigationStatus;
                  const updated = investigations.map((inv) => (inv.id === sc.id ? { ...inv, status: ns } : inv));
                  setInvestigations(updated);
                  setSelectedCase({ ...sc, status: ns });
                }}
                className={`${selectCls} pr-7`}
              >
                {(['open', 'in_progress', 'escalated', 'closed'] as InvestigationStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color={C.textDim} className="pointer-events-none absolute top-2.5 right-2" />
            </div>
            <span className={`rounded-[6px] ${badgeCls}`} style={badge(priorityColor(sc.priority))}>
              {sc.priority.toUpperCase()}
            </span>
            <div className="flex items-center gap-1">
              <User size={12} color={C.textDim} />
              <span className="text-text text-xs">{sc.assignee}</span>
            </div>
          </div>

          {/* Description */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Description</div>
            <div className="text-text text-[13px] leading-relaxed">{sc.desc}</div>
            {sc.impact && (
              <div className="text-text-dim mt-2.5 text-xs">
                Impact: <strong className="text-text">{sc.impact}</strong>
              </div>
            )}
          </div>

          {/* Linked Events & Users */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { title: 'Linked Events', items: sc.linkedEvents, color: C.primary },
              { title: 'Linked Users', items: sc.linkedUsers, color: C.text },
            ].map((sec) => (
              <div key={sec.title} className={cardCls} style={cardStyle}>
                <div className={sectionTitleCls}>
                  {sec.title} ({sec.items.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sec.items.length === 0 ? (
                    <span className="text-text-dim text-xs">None</span>
                  ) : (
                    sec.items.map((id) => (
                      <span
                        key={id}
                        className="bg-surface-alt rounded-md px-2.5 py-1 text-xs font-semibold"
                        style={{
                          color: sec.color,
                          border: `1px solid ${C.border}`,
                        }}
                      >
                        {id}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Investigation Notes Timeline */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Investigation Notes</div>
            <div className="flex flex-col">
              {sc.notes.map((note, ni) => (
                <div
                  key={note.id}
                  className={clsx('flex gap-3', ni < sc.notes.length - 1 && 'mb-3.5 pb-3.5')}
                  style={{
                    borderBottom: ni < sc.notes.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <div
                    className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: C.primary,
                    }}
                  />
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-text text-xs font-semibold">{note.author}</span>
                      <span className="text-text-dim text-[11px]">
                        <Clock size={10} className="mr-0.5" />
                        {note.time}
                      </span>
                    </div>
                    <div className="text-text text-[13px] leading-normal">{note.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Findings */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Findings</div>
            <textarea
              value={sc.findings}
              onChange={(e) => {
                const updated = investigations.map((inv) =>
                  inv.id === sc.id ? { ...inv, findings: e.target.value } : inv,
                );
                setInvestigations(updated);
                setSelectedCase({ ...sc, findings: e.target.value });
              }}
              placeholder="Enter investigation findings..."
              className={`${inputCls} resize-y font-[inherit]`}
              style={{
                minHeight: 80,
              }}
            />
          </div>

          {/* Resolution */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'No Fraud Found', color: '#10B981' },
              { label: 'Fraud Confirmed', color: '#EF4444' },
              { label: 'Inconclusive', color: '#F59E0B' },
            ].map((r) => (
              <button
                type="button"
                key={r.label}
                className={`${btnOutlineCls} text-[13px]`}
                style={{
                  borderColor: r.color,
                  color: r.color,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // ─── Create Case Modal ───────────────────────────────────
    const createCaseModal = showCreateCase && (
      <div
        className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50"
        onClick={() => setShowCreateCase(false)}
      >
        <div
          className={`${cardCls} !bg-bg w-[90%] max-w-[480px]`}
          style={{ border: `1.5px solid ${C.border}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="text-text text-base font-bold">Create Investigation Case</div>
            <X size={18} color={C.textDim} className="cursor-pointer" onClick={() => setShowCreateCase(false)} />
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-text-dim mb-1 text-xs font-semibold">Title</div>
              <input
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                placeholder="Case title..."
                className={inputCls}
              />
            </div>
            <div>
              <div className="text-text-dim mb-1 text-xs font-semibold">Description</div>
              <textarea
                value={newCaseDesc}
                onChange={(e) => setNewCaseDesc(e.target.value)}
                placeholder="Describe the investigation..."
                className={`${inputCls} resize-y font-[inherit]`}
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-text-dim mb-1 text-xs font-semibold">Priority</div>
                <div className="relative">
                  <select
                    value={newCasePriority}
                    onChange={(e) => setNewCasePriority(e.target.value as typeof newCasePriority)}
                    className={selectCls}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <ChevronDown
                    size={14}
                    color={C.textDim}
                    className="pointer-events-none absolute"
                    style={{ right: 8, top: 10 }}
                  />
                </div>
              </div>
              <div>
                <div className="text-text-dim mb-1 text-xs font-semibold">Assignee</div>
                <div className="relative">
                  <select
                    value={newCaseAssignee}
                    onChange={(e) => setNewCaseAssignee(e.target.value)}
                    className={selectCls}
                  >
                    <option>Jude Mensah</option>
                    <option>Kwame Asante</option>
                    <option>Akua Sarpong</option>
                  </select>
                  <ChevronDown
                    size={14}
                    color={C.textDim}
                    className="pointer-events-none absolute"
                    style={{ right: 8, top: 10 }}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!newCaseTitle.trim()) return;
                const newCase: Investigation = {
                  id: `INV-2026-${String(investigations.length + 1).padStart(3, '0')}`,
                  title: newCaseTitle,
                  status: 'open',
                  priority: newCasePriority,
                  assignee: newCaseAssignee,
                  created: '2026-02-15',
                  updated: '2026-02-15',
                  desc: newCaseDesc,
                  linkedEvents: [],
                  linkedUsers: [],
                  impact: 'TBD',
                  notes: [],
                  findings: '',
                  resolution: null,
                };
                setInvestigations([newCase, ...investigations]);
                setNewCaseTitle('');
                setNewCaseDesc('');
                setShowCreateCase(false);
              }}
              className={btnPrimaryCls}
            >
              Create Case
            </button>
          </div>
        </div>
      </div>
    );

    // ─── Investigation List View ─────────────────────────────
    return (
      <div className="flex flex-col gap-4">
        {createCaseModal}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Open" value={invCounts.open} color="#3B82F6" />
          <KpiCard label="In Progress" value={invCounts.in_progress} color="#F59E0B" />
          <KpiCard label="Escalated" value={invCounts.escalated} color="#EF4444" />
          <KpiCard label="Closed" value={invCounts.closed} color="#10B981" />
        </div>

        {/* Create Case Button */}
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowCreateCase(true)} className={btnPrimaryCls}>
            <Plus size={14} className="mr-1" /> Create Case
          </button>
        </div>

        {/* Case Table */}
        <div className="overflow-hidden rounded-[14px] p-0" style={cardStyle}>
          {investigations.map((inv, idx) => (
            <div
              key={inv.id}
              onClick={() => setSelectedCase(inv)}
              className="hover:bg-surface-alt flex cursor-pointer flex-wrap items-center gap-2.5 px-4 py-3 transition-[background] duration-150"
              style={{
                borderBottom: idx < investigations.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <div className="min-w-[160px] flex-1">
                <div className="text-text text-[13px] font-semibold">{inv.title}</div>
                <div className="text-text-dim mt-0.5 text-[11px]">{inv.id}</div>
              </div>
              <span className={`rounded-[6px] ${badgeCls}`} style={badge(statusColor(inv.status))}>
                {statusLabel(inv.status)}
              </span>
              <span className={`rounded-[6px] ${badgeCls}`} style={badge(priorityColor(inv.priority))}>
                {inv.priority.toUpperCase()}
              </span>
              <span className="text-text-dim min-w-[80px] text-xs">
                <User size={10} className="mr-[3px]" />
                {inv.assignee}
              </span>
              <span className="text-text-dim text-[11px]">{inv.created}</span>
              <ChevronRight size={16} color={C.textDim} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Sub-tab 3: Anomalies ────────────────────────────────
  const renderAnomalies = () => (
    <div className="flex flex-col gap-4">
      {/* Severity Distribution KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Critical" value={anomalyCounts.critical} color="#9333EA" />
        <KpiCard label="High" value={anomalyCounts.high} color="#EF4444" />
        <KpiCard label="Medium" value={anomalyCounts.medium} color="#F59E0B" />
        <KpiCard label="Low" value={anomalyCounts.low} color="#10B981" />
      </div>

      {/* Detection Rules */}
      <div>
        <div className={sectionTitleCls}>Detection Rules</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {detectionRules.map((rule) => (
            <div key={rule.id} className={`${cardCls} flex flex-col gap-2.5`} style={cardStyle}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-text text-[13px] font-semibold">{rule.name}</span>
                    <span className={`rounded-[6px] ${badgeCls}`} style={badge(priorityColor(rule.severity))}>
                      {rule.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-text-dim text-xs leading-snug">{rule.desc}</div>
                </div>
                <ToggleSwitch
                  on={rule.enabled}
                  onToggle={() => {
                    setDetectionRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)),
                    );
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-[11px]">Threshold: {rule.threshold}</span>
                <span className="text-text text-[11px] font-semibold">
                  {rule.triggers} trigger{rule.triggers !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Anomalies Feed */}
      <div>
        <div className={sectionTitleCls}>Recent Anomalies</div>
        <div className="overflow-hidden rounded-[14px] p-0" style={cardStyle}>
          {anomalies.map((anom, idx) => (
            <div
              key={anom.id}
              className="px-4 py-3"
              style={{
                borderBottom: idx < anomalies.length - 1 ? `1px solid ${C.border}` : 'none',
              }}
            >
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-[6px] ${badgeCls}`} style={badge(priorityColor(anom.severity))}>
                  {anom.severity.toUpperCase()}
                </span>
                <span className="text-text text-[13px] font-semibold">{anom.rule}</span>
                <span className="text-text-dim ml-auto text-[11px]">
                  <Clock size={10} className="mr-0.5" />
                  {anom.ts}
                </span>
              </div>
              <div className="text-text-dim mb-1 text-xs">
                Entity: <strong className="text-text">{anom.entity}</strong>
              </div>
              <div className="text-text mb-2 text-xs leading-snug">{anom.summary}</div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-[6px] ${badgeCls}`} style={badge(statusColor(anom.status))}>
                  {statusLabel(anom.status)}
                </span>
                {anom.status !== 'dismissed' && anom.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAnomalies((prev) => prev.map((a) => (a.id === anom.id ? { ...a, status: 'dismissed' } : a)));
                    }}
                    className={`${btnOutlineCls} px-2.5 py-1 text-[11px]`}
                  >
                    Dismiss
                  </button>
                )}
                {!anom.linkedCase && anom.status !== 'dismissed' && (
                  <button
                    type="button"
                    className={`${btnOutlineCls} px-2.5 py-1 text-[11px]`}
                    style={{
                      color: C.primary,
                      borderColor: C.primary,
                    }}
                  >
                    Create Case
                  </button>
                )}
                {anom.linkedCase && (
                  <button
                    type="button"
                    onClick={() => {
                      const linked = investigations.find((inv) => inv.id === anom.linkedCase);
                      if (linked) {
                        setSelectedCase(linked);
                        setSubTab('investigations');
                      }
                    }}
                    className={`${btnOutlineCls} px-2.5 py-1 text-[11px]`}
                    style={{
                      color: C.primary,
                      borderColor: C.primary,
                    }}
                  >
                    <Eye size={10} className="mr-[3px]" /> View {anom.linkedCase}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Sub-tab 4: Forensics ────────────────────────────────
  const renderForensics = () => {
    const selectedUser = selectedForensicUser
      ? (forensicUsers.find((u) => u.id === selectedForensicUser) ?? null)
      : null;

    // ─── User Detail View ────────────────────────────────────
    if (selectedUser) {
      const linkedInvs = investigations.filter((inv) =>
        inv.linkedUsers.some((uid) => uid === selectedUser.id || selectedUser.name.includes(uid.replace('usr', ''))),
      );
      return (
        <div className="flex flex-col gap-4">
          {/* Back */}
          <div
            onClick={() => setSelectedForensicUser(null)}
            className="text-primary flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold"
          >
            <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to users
          </div>

          {/* User Header */}
          <div className={`${cardCls} flex flex-wrap items-center gap-3.5`} style={cardStyle}>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white"
              style={{
                background: C.primary,
              }}
            >
              {selectedUser.avatar}
            </div>
            <div className="min-w-[140px] flex-1">
              <div className="text-text text-base font-bold">{selectedUser.name}</div>
              <div className="text-text-dim text-xs">{selectedUser.email}</div>
            </div>
            <div className="text-center">
              <div className="text-text-dim mb-0.5 text-[11px]">Risk Score</div>
              <div className="text-xl font-bold" style={{ color: riskColor(selectedUser.riskScore) }}>
                {selectedUser.riskScore}
              </div>
            </div>
            {/* Behavioral Flags */}
            {(MOCK_BEHAVIORAL_FLAGS[selectedUser.id] ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1" style={{ flex: '0 0 100%' }}>
                {(MOCK_BEHAVIORAL_FLAGS[selectedUser.id] ?? []).map((flag) => (
                  <span
                    key={flag}
                    className="rounded-md px-2.5 py-[3px] text-[11px] font-semibold"
                    style={{
                      background: `${FLAG_COLORS[flag] ?? '#6B7280'}18`,
                      color: FLAG_COLORS[flag] ?? '#6B7280',
                    }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Login History */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Login History</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {['Timestamp', 'IP Address', 'Device', 'Location', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="text-text-dim px-2.5 py-2 text-left text-[11px] font-semibold whitespace-nowrap"
                        style={{ borderBottom: `1.5px solid ${C.border}` }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_USER_FORENSIC_LOGINS.map((login, i) => (
                    <tr key={i}>
                      <td
                        className="text-text px-2.5 py-2 whitespace-nowrap"
                        style={{ borderBottom: `1px solid ${C.border}` }}
                      >
                        <Clock size={10} className="mr-1" />
                        {login.ts}
                      </td>
                      <td
                        className="text-text px-2.5 py-2 font-mono text-[11px]"
                        style={{ borderBottom: `1px solid ${C.border}` }}
                      >
                        {login.ip}
                      </td>
                      <td className="text-text px-2.5 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <Monitor size={10} className="mr-1" />
                        {login.device}
                      </td>
                      <td className="text-text px-2.5 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <MapPin size={10} className="mr-1" />
                        {login.location}
                      </td>
                      <td className="px-2.5 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <span
                          className={`rounded-[6px] ${badgeCls}`}
                          style={badge(login.status === 'success' ? '#10B981' : '#EF4444')}
                        >
                          {login.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Activity Heatmap</div>
            <div className="overflow-x-auto">
              <svg width={24 * 20 + 50} height={7 * 20 + 30} className="block">
                {/* Hour labels */}
                {Array.from({ length: 24 }, (_, h) => (
                  <text
                    key={`h${h}`}
                    x={50 + h * 20 + 8}
                    y={12}
                    textAnchor="middle"
                    style={{ fontSize: 9, fill: C.textDim }}
                  >
                    {h}
                  </text>
                ))}
                {/* Day labels */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                  <text key={d} x={42} y={26 + i * 20 + 11} textAnchor="end" style={{ fontSize: 9, fill: C.textDim }}>
                    {d}
                  </text>
                ))}
                {/* Cells */}
                {MOCK_HEATMAP.map((row, day) =>
                  row.map((val, hour) => {
                    const opacity = val === 0 ? 0.03 : val <= 1 ? 0.12 : val <= 3 ? 0.25 : val <= 6 ? 0.5 : 0.85;
                    return (
                      <rect
                        key={`${day}-${hour}`}
                        x={50 + hour * 20}
                        y={20 + day * 20}
                        width={16}
                        height={16}
                        rx={3}
                        ry={3}
                        fill={C.primary}
                        opacity={opacity}
                      />
                    );
                  }),
                )}
              </svg>
            </div>
          </div>

          {/* Linked Investigations */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Linked Investigations</div>
            {linkedInvs.length === 0 ? (
              <div className="text-text-dim text-xs">No linked investigations.</div>
            ) : (
              linkedInvs.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-2 py-2"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <span className="text-primary text-xs font-semibold">{inv.id}</span>
                  <span className="text-text flex-1 text-xs">{inv.title}</span>
                  <span className={`rounded-[6px] ${badgeCls}`} style={badge(statusColor(inv.status))}>
                    {statusLabel(inv.status)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Risk Breakdown */}
          <div className={cardCls} style={cardStyle}>
            <div className={sectionTitleCls}>Risk Breakdown</div>
            {[
              { label: 'Auth Risk', pct: 30, color: '#EF4444' },
              { label: 'Financial Risk', pct: 20, color: '#F59E0B' },
              { label: 'Behavioral', pct: 15, color: '#3B82F6' },
              { label: 'Data Access', pct: 10, color: '#8B5CF6' },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <div className="mb-1 flex justify-between">
                  <span className="text-text text-xs">{item.label}</span>
                  <span className="text-xs font-semibold" style={{ color: item.color }}>
                    {item.pct}%
                  </span>
                </div>
                <div className="bg-surface-alt h-2 rounded">
                  <div
                    className="h-full rounded transition-[width] duration-300"
                    style={{
                      background: item.color,
                      width: `${item.pct}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ─── Forensic Overview ───────────────────────────────────
    const flaggedCount = forensicUsers.filter((u) => u.riskScore > 50).length;
    const highRiskCount = forensicUsers.filter((u) => u.riskScore > 75).length;
    const no2FACount = forensicUsers.filter((u) => !u.has2FA).length;

    return (
      <div className="flex flex-col gap-4">
        {/* Risk Overview KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Total Users" value={forensicUsers.length} color={C.primary ?? '#3B82F6'} />
          <KpiCard label="Flagged Users" value={flaggedCount} color="#F59E0B" />
          <KpiCard label="High+ Risk" value={highRiskCount} color="#EF4444" />
          <KpiCard label="No 2FA" value={no2FACount} color="#9333EA" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-surface-alt flex gap-1 rounded-lg p-[3px]">
            {(['all', 'frontend', 'admin', 'flagged'] as ForensicFilter[]).map((f) => (
              /* Admin theme override — C.textDim comes from ADMIN_THEMES, not useColors() */
              <TabButton
                key={f}
                active={forensicFilter === f}
                variant="pill"
                activeColor={C.primary}
                onClick={() => setForensicFilter(f)}
                className="capitalize"
                style={{
                  ...(forensicFilter !== f && { color: C.textDim }),
                }}
              >
                {f}
              </TabButton>
            ))}
          </div>
          {/* Sort controls */}
          <div className="bg-surface-alt flex gap-1 rounded-lg p-[3px]">
            {[
              { id: 'default' as const, label: 'Default' },
              { id: 'risk_desc' as const, label: 'Risk \u2193' },
              { id: 'risk_asc' as const, label: 'Risk \u2191' },
            ].map((s) => (
              /* Admin theme override — C.textDim comes from ADMIN_THEMES, not useColors() */
              <TabButton
                key={s.id}
                active={forensicSort === s.id}
                variant="pill"
                activeColor={C.primary}
                onClick={() => setForensicSort(s.id)}
                style={{
                  ...(forensicSort !== s.id && { color: C.textDim }),
                }}
              >
                {s.label}
              </TabButton>
            ))}
          </div>
          <div className="relative min-w-[160px]" style={{ flex: '1 1 180px' }}>
            <Search size={14} color={C.textDim} className="absolute top-2.5 left-2.5" />
            <input
              value={forensicSearch}
              onChange={(e) => setForensicSearch(e.target.value)}
              placeholder="Search users..."
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {/* User List */}
        <div className="overflow-hidden rounded-[14px] p-0" style={cardStyle}>
          {filteredForensicUsers.length === 0 ? (
            <div className="text-text-dim p-10 text-center text-[13px]">No users match your filters.</div>
          ) : (
            filteredForensicUsers.map((user, idx) => {
              const rc = riskColor(user.riskScore);
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedForensicUser(user.id)}
                  className="hover:bg-surface-alt flex cursor-pointer flex-wrap items-center gap-2.5 px-4 py-3 transition-[background] duration-150"
                  style={{
                    borderBottom: idx < filteredForensicUsers.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{
                      background: C.primary,
                    }}
                  >
                    {user.avatar}
                  </div>
                  <div className="min-w-[120px] flex-1">
                    <div className="text-text text-[13px] font-semibold">{user.name}</div>
                    <div className="text-text-dim text-[11px]">{user.email}</div>
                  </div>
                  <span
                    className={`capitalize ${badgeCls}`}
                    style={{
                      ...badge(user.plan === 'max' ? '#8B5CF6' : user.plan === 'basic' ? '#3B82F6' : '#6B7280'),
                    }}
                  >
                    {user.plan}
                  </span>
                  <span
                    className={`rounded-[6px] ${badgeCls}`}
                    style={badge(
                      user.status === 'active' ? '#10B981' : user.status === 'pending' ? '#F59E0B' : '#EF4444',
                    )}
                  >
                    {statusLabel(user.status)}
                  </span>
                  {/* Risk Score Bar */}
                  <div className="flex w-[80px] items-center gap-1.5">
                    <div className="bg-surface-alt h-2 flex-1 rounded">
                      <div
                        className="h-full rounded transition-[width] duration-300"
                        style={{
                          background: rc,
                          width: `${user.riskScore}%`,
                        }}
                      />
                    </div>
                    <span className="min-w-[22px] text-right text-[11px] font-semibold" style={{ color: rc }}>
                      {user.riskScore}
                    </span>
                  </div>
                  {/* Behavioral Flags */}
                  {(MOCK_BEHAVIORAL_FLAGS[user.id] ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-[46px]" style={{ flex: '0 0 100%' }}>
                      {(MOCK_BEHAVIORAL_FLAGS[user.id] ?? []).map((flag) => (
                        <span
                          key={flag}
                          className="rounded px-1.5 py-px text-[9px] font-bold"
                          style={{
                            background: `${FLAG_COLORS[flag] ?? '#6B7280'}18`,
                            color: FLAG_COLORS[flag] ?? '#6B7280',
                          }}
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                  <ChevronRight size={16} color={C.textDim} />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ─── Sub-tab 5: Reports ──────────────────────────────────
  const renderReports = () => (
    <div className="flex flex-col gap-4">
      {/* Generate Report Card */}
      <div className={cardCls} style={cardStyle}>
        <div className={sectionTitleCls}>Generate Investigation Report</div>
        <div className="flex flex-wrap items-end gap-3">
          <div style={{ flex: '1 1 240px' }}>
            <div className="text-text-dim mb-1 text-xs font-semibold">Select Case</div>
            <div className="relative">
              <select value={reportCaseId} onChange={(e) => setReportCaseId(e.target.value)} className={selectCls}>
                <option value="">Choose a case...</option>
                {investigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} &mdash; {inv.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color={C.textDim} className="pointer-events-none absolute top-2.5 right-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportCase && (
        <div className={cardCls} style={cardStyle}>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-text text-base font-bold">Report Preview</div>
            <span className={`rounded-[6px] ${badgeCls}`} style={badge(statusColor(reportCase.status))}>
              {statusLabel(reportCase.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Summary */}
            <div>
              <div className="text-text-dim mb-1.5 text-xs font-semibold">Case Summary</div>
              <div className="text-text mb-3 text-[13px] leading-relaxed">
                <strong>{reportCase.title}</strong>
                <br />
                <br />
                {reportCase.desc}
              </div>
              <div className="text-text-dim text-xs">
                Priority:{' '}
                <span className="font-semibold" style={{ color: priorityColor(reportCase.priority) }}>
                  {reportCase.priority.toUpperCase()}
                </span>
              </div>
              <div className="text-text-dim mt-1 text-xs">
                Assignee: <span className="text-text font-semibold">{reportCase.assignee}</span>
              </div>
              <div className="text-text-dim mt-1 text-xs">
                Impact: <span className="text-text font-semibold">{reportCase.impact}</span>
              </div>
            </div>

            {/* Metrics */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-alt rounded-[10px] p-3.5 text-center">
                  <div className="text-primary text-xl font-bold">{reportCase.linkedEvents.length}</div>
                  <div className="text-text-dim mt-0.5 text-[11px]">Evidence Items</div>
                </div>
                <div className="bg-surface-alt rounded-[10px] p-3.5 text-center">
                  <div className="text-primary text-xl font-bold">{reportCase.linkedUsers.length}</div>
                  <div className="text-text-dim mt-0.5 text-[11px]">Persons of Interest</div>
                </div>
                <div className="bg-surface-alt col-span-full rounded-[10px] p-3.5 text-center">
                  <div className="text-text text-sm font-bold">
                    {reportCase.resolution ? statusLabel(reportCase.resolution) : 'Pending'}
                  </div>
                  <div className="text-text-dim mt-0.5 text-[11px]">Resolution</div>
                </div>
              </div>

              {/* Findings */}
              {reportCase.findings && (
                <div className="mt-3.5">
                  <div className="text-text-dim mb-1 text-xs font-semibold">Findings</div>
                  <div className="text-text text-xs leading-normal">{reportCase.findings}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Summary */}
          <div className="mt-4">
            <div className="text-text-dim mb-2 text-xs font-semibold">
              Investigation Timeline ({reportCase.notes.length} notes)
            </div>
            {reportCase.notes.map((note, ni) => (
              <div
                key={note.id}
                className="mb-2 flex gap-2 pb-2"
                style={{
                  borderBottom: ni < reportCase.notes.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div
                  className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: C.primary,
                  }}
                />
                <div>
                  <div className="text-text-dim text-[11px]">
                    {note.author} &middot; {note.time}
                  </div>
                  <div className="text-text mt-0.5 text-xs">{note.text}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Export Buttons */}
          <div className="mt-4 flex gap-2.5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            <button type="button" className={btnPrimaryCls}>
              <FileText size={14} className="mr-1.5" /> Export PDF
            </button>
            <button type="button" className={`${btnOutlineCls} text-[13px]`}>
              <FileText size={14} className="mr-1.5" /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!reportCase && (
        <div className={`${cardCls} p-12 text-center`} style={cardStyle}>
          <FileText size={32} color={C.textDim} className="mb-3" />
          <div className="text-text mb-1 text-sm font-semibold">Select a case to preview report</div>
          <div className="text-text-dim text-xs">Choose an investigation case above to generate a detailed report.</div>
        </div>
      )}
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Shield size={20} color={C.primary} />
        <div className="text-text text-lg font-bold">Audit & Fraud</div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-surface-alt flex gap-1 overflow-x-auto rounded-[10px] p-1">
        {SUB_TAB_LABELS.map(({ key, label }) => (
          /* Admin theme override — C.textDim comes from ADMIN_THEMES, not useColors() */
          <TabButton
            key={key}
            active={subTab === key}
            variant="pill"
            activeColor={C.primary}
            onClick={() => setSubTab(key)}
            className="rounded-lg px-4 py-2 text-[13px] whitespace-nowrap"
            style={{
              ...(subTab !== key && { color: C.textDim }),
            }}
          >
            {label}
          </TabButton>
        ))}
      </div>

      {/* Sub-tab Content */}
      {subTab === 'activityLog' && renderActivityLog()}
      {subTab === 'investigations' && renderInvestigations()}
      {subTab === 'anomalies' && renderAnomalies()}
      {subTab === 'forensics' && renderForensics()}
      {subTab === 'reports' && renderReports()}
    </div>
  );
}
