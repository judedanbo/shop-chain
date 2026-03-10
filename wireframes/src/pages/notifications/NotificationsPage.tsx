import React, { useState } from 'react';
import clsx from 'clsx';
import {
  Bell,
  Trash2,
  CheckCircle,
  Package,
  ShoppingCart,
  RotateCcw,
  AlertTriangle,
  Users,
  Monitor,
  UserPlus,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useColors, useNavigation, useNotifications } from '@/context';
import { paginate } from '@/utils/pagination';
import { Paginator } from '@/components/ui';
import type { NotificationCategory, AppNotification, ThemeColors } from '@/types';

// ─── Constants ───

const CATEGORY_ICONS: Record<NotificationCategory, typeof Bell> = {
  stock_alert: Package,
  order_update: ShoppingCart,
  sale_event: RotateCcw,
  approval_request: AlertTriangle,
  team_update: Users,
  system: Monitor,
  customer: UserPlus,
};

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  stock_alert: 'Stock',
  order_update: 'Orders',
  sale_event: 'Sales',
  approval_request: 'Approvals',
  team_update: 'Team',
  system: 'System',
  customer: 'Customers',
};

const CATEGORY_COLORS: Record<NotificationCategory, (c: ThemeColors) => string> = {
  stock_alert: (c) => c.warning,
  order_update: (c) => c.primary,
  sale_event: (c) => c.accent,
  approval_request: (c) => c.danger,
  team_update: (c) => c.success,
  system: (c) => c.textMuted,
  customer: (c) => c.primary,
};

const PRIORITY_COLORS: Record<string, (c: ThemeColors) => string> = {
  low: (c) => c.textDim,
  medium: (c) => c.primary,
  high: (c) => c.warning,
  critical: (c) => c.danger,
};

// ─── Date grouping helpers ───

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;
  const t = d.getTime();
  if (t >= todayStart) return 'Today';
  if (t >= yesterdayStart) return 'Yesterday';
  if (t >= weekStart) return 'This Week';
  return 'Older';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── NotificationsPage ───

export const NotificationsPage: React.FC = () => {
  const COLORS = useColors();
  const { setPage } = useNavigation();
  const { notifications, unreadCount, markAsRead, markAllRead, deleteNotification } = useNotifications();

  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | NotificationCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [tblPage, setTblPage] = useState(1);

  // Filtering
  const filtered = notifications.filter((n) => {
    if (readFilter === 'unread' && n.read) return false;
    if (readFilter === 'read' && !n.read) return false;
    if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    return true;
  });

  const PER_PAGE = 15;
  const pag = paginate(filtered, tblPage, PER_PAGE);

  // Group by date
  const grouped: { label: string; items: AppNotification[] }[] = [];
  let currentGroup = '';
  for (const n of pag.items) {
    const g = getDateGroup(n.createdAt);
    if (g !== currentGroup) {
      currentGroup = g;
      grouped.push({ label: g, items: [] });
    }
    const last = grouped[grouped.length - 1];
    if (last) last.items.push(n);
  }

  const handleClick = (n: AppNotification) => {
    markAsRead(n.id);
    if (n.actionUrl) {
      setPage(n.actionUrl);
    }
  };

  // ─── Styles ───
  const pillCls = 'px-3.5 py-1.5 text-[11px] font-semibold';
  const pillStyle = (active: boolean, color?: string): React.CSSProperties => ({
    border: active ? `1.5px solid ${color || COLORS.primary}` : `1px solid ${COLORS.border}`,
    background: active ? `${color || COLORS.primary}15` : 'transparent',
    color: active ? color || COLORS.primary : COLORS.textMuted,
  });

  return (
    <div className="mx-auto max-w-[900px] p-4 sm:p-6 lg:p-7">
      {/* Header */}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="text-text m-0 text-[22px] font-black sm:text-[26px]">Notifications</h1>
          <p className="text-text-dim mt-1 text-xs">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="bg-primary-bg text-primary border-primary/[0.19] flex items-center gap-1.5 rounded-[10px] border px-4 py-2 font-[inherit] text-xs font-bold"
          >
            <CheckCircle size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Read/Unread pills */}
        {(
          [
            ['all', 'All'],
            ['unread', 'Unread'],
            ['read', 'Read'],
          ] as const
        ).map(([val, label]) => (
          <button
            type="button"
            key={val}
            className={`rounded-lg font-[inherit] transition-all duration-150 ${pillCls}`}
            onClick={() => {
              setReadFilter(val);
              setTblPage(1);
            }}
            style={pillStyle(readFilter === val)}
          >
            {label}
            {val === 'unread' && unreadCount > 0 && (
              <span className="bg-danger ml-[5px] inline-block min-w-[14px] rounded-md px-[5px] py-px text-center text-[9px] font-extrabold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Filter toggle */}
        <button
          type="button"
          className={`rounded-lg font-[inherit] transition-all duration-150 ${pillCls}`}
          onClick={() => setShowFilters(!showFilters)}
          style={pillStyle(showFilters, COLORS.accent)}
        >
          <Filter size={12} className="mr-1 align-middle" />
          Filters
        </button>
      </div>

      {/* Extra Filters */}
      {showFilters && (
        <div className="bg-surface border-border mb-[18px] flex flex-wrap gap-4 rounded-[14px] border-[1.5px] px-[18px] py-3.5">
          {/* Category filter */}
          <div>
            <div className="form-label mb-1.5 tracking-wide">Category</div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={`rounded-lg font-[inherit] transition-all duration-150 ${pillCls}`}
                onClick={() => {
                  setCategoryFilter('all');
                  setTblPage(1);
                }}
                style={pillStyle(categoryFilter === 'all')}
              >
                All
              </button>
              {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  className={`rounded-lg font-[inherit] transition-all duration-150 ${pillCls}`}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setTblPage(1);
                  }}
                  style={pillStyle(categoryFilter === cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          {/* Priority filter */}
          <div>
            <div className="form-label mb-1.5 tracking-wide">Priority</div>
            <div className="flex flex-wrap gap-1">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={`rounded-lg font-[inherit] transition-all duration-150 ${pillCls}`}
                  onClick={() => {
                    setPriorityFilter(p);
                    setTblPage(1);
                  }}
                  style={pillStyle(priorityFilter === p)}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-text-dim mb-3 text-[11px]">
        {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
        {(readFilter !== 'all' || categoryFilter !== 'all' || priorityFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setReadFilter('all');
              setCategoryFilter('all');
              setPriorityFilter('all');
              setTblPage(1);
            }}
            className="text-primary ml-2 border-none bg-transparent font-[inherit] text-[11px] font-semibold"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Notification Groups */}
      <div className="bg-surface border-border overflow-hidden rounded-2xl border-[1.5px]">
        {pag.items.length === 0 ? (
          <div className="p-[60px] text-center">
            <Bell size={32} className="text-text-dim mb-2.5" />
            <div className="text-text-muted text-sm font-bold">No notifications</div>
            <div className="text-text-dim mt-1 text-xs">
              {readFilter === 'unread' ? 'No unread notifications' : 'Nothing matches your filters'}
            </div>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              {/* Date group header */}
              <div className="form-label bg-surface-alt border-border border-b px-[18px] py-2.5 tracking-wide">
                {group.label}
              </div>
              {/* Notifications in group */}
              {group.items.map((n) => {
                const Icon = CATEGORY_ICONS[n.category];
                const catColor = CATEGORY_COLORS[n.category](COLORS);
                const prioColor = PRIORITY_COLORS[n.priority]?.(COLORS) || COLORS.textDim;
                return (
                  <div
                    key={n.id}
                    className={clsx(
                      'hover:bg-primary/[0.04] flex gap-2.5 px-3.5 py-3 transition-colors sm:gap-3.5 sm:px-[18px] sm:py-3.5',
                      !n.read && 'bg-primary/[0.02]',
                      n.actionUrl ? 'cursor-pointer' : 'cursor-default',
                    )}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}08`,
                    }}
                    onClick={() => handleClick(n)}
                  >
                    {/* Icon */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${catColor}12` }}
                    >
                      <Icon size={18} style={{ color: catColor }} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-text text-[13px]" style={{ fontWeight: n.read ? 600 : 700 }}>
                            {n.title}
                          </span>
                          {n.priority === 'high' || n.priority === 'critical' ? (
                            <span
                              className="rounded px-1.5 py-px text-[9px] font-bold tracking-[0.3px] uppercase"
                              style={{
                                color: prioColor,
                                background: `${prioColor}12`,
                              }}
                            >
                              {n.priority}
                            </span>
                          ) : null}
                          {n.requiresAction && !n.actionTaken && (
                            <span className="bg-warning/[0.07] text-warning rounded px-1.5 py-px text-[9px] font-bold">
                              Action needed
                            </span>
                          )}
                        </div>
                        <span className="text-text-dim shrink-0 text-[10px] whitespace-nowrap">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <div className="text-text-dim mt-1 text-xs leading-normal">{n.message}</div>
                      {/* Meta: actor, category, channels */}
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {n.actor && (
                          <span className="text-text-muted text-[10px]">
                            By: <span className="font-semibold">{n.actor}</span>
                            {n.actorRole && <span className="text-text-dim"> ({n.actorRole})</span>}
                          </span>
                        )}
                        <span className="text-text-dim text-[10px]">{CATEGORY_LABELS[n.category]}</span>
                        {n.channels.length > 0 && (
                          <span className="text-text-dim text-[9px]">{n.channels.join(', ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      {!n.read && (
                        <div
                          title="Mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="text-primary border-primary/[0.13] bg-primary/[0.03] flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border"
                        >
                          <Eye size={13} />
                        </div>
                      )}
                      {n.read && (
                        <div className="flex h-7 w-7 items-center justify-center">
                          <EyeOff size={13} className="text-text-dim" />
                        </div>
                      )}
                      <div
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="text-text-dim flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg"
                      >
                        <Trash2 size={13} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div className="px-3.5">
          <Paginator
            total={pag.total}
            page={pag.page}
            totalPages={pag.totalPages}
            perPage={PER_PAGE}
            start={pag.start}
            onPage={setTblPage}
          />
        </div>
      </div>
    </div>
  );
};
