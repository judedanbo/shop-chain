import { useState } from 'react';
import clsx from 'clsx';
import { BarChart3, Plus, Edit3, X } from 'lucide-react';
import type { Milestone } from '@/types/admin.types';
import {
  INV_ENGAGEMENT,
  INV_USER_GROWTH,
  INV_SHOP_GROWTH,
  INV_COHORT_RETENTION,
  INV_MILESTONES,
  MILESTONE_ICONS,
} from '@/constants/adminInvestors';
import { FIN_REVENUE } from '@/constants/adminFinances';
import type { AdminThemeColors } from '@/constants/adminThemes';

interface AdminInvestorsTabProps {
  C: AdminThemeColors;
}
type SubTab = 'metrics' | 'growth' | 'usersShops' | 'deck';

function buildSvgPath(values: number[], w: number, h: number, pad = 10) {
  const min = Math.min(...values),
    max = Math.max(...values) || 1;
  const stepX = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const last = pts[pts.length - 1] ?? { x: 0, y: 0 };
  const first = pts[0] ?? { x: 0, y: 0 };
  const area = `${line} L${last.x},${h} L${first.x},${h} Z`;
  return { line, area };
}

const ML = (m: string) => {
  const [y, mo] = m.split('-');
  const N = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${N[Number(mo) - 1]} ${y!.slice(2)}`;
};

function MiniChart({ data, color, id, h = 80 }: { data: number[]; color: string; id: string; h?: number }) {
  const { line, area } = buildSvgPath(data, 500, h);
  return (
    <svg viewBox={`0 0 500 ${h}`} className="mt-3.5 h-auto w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
}

export function AdminInvestorsTab({ C }: AdminInvestorsTabProps) {
  const [subTab, setSubTab] = useState<SubTab>('metrics');
  const [milestones, setMilestones] = useState<Milestone[]>([...INV_MILESTONES]);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [msIcon, setMsIcon] = useState('');
  const [msDate, setMsDate] = useState('');
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');

  const cardCls = 'p-5 rounded-[14px]';
  const kLCls = 'form-label tracking-[0.5px]';
  const kVCls = 'text-2xl font-black';
  const sTCls = 'text-sm font-bold mb-3.5';

  const tabs: { key: SubTab; label: string }[] = [
    { key: 'metrics', label: 'Metrics' },
    { key: 'growth', label: 'Growth' },
    { key: 'usersShops', label: 'Users & Shops' },
    { key: 'deck', label: 'Deck' },
  ];

  const openModal = (ms?: Milestone) => {
    setEditingMilestone(ms ?? null);
    setMsIcon(ms?.icon ?? '\u{1F680}');
    setMsDate(ms?.date ?? '');
    setMsTitle(ms?.title ?? '');
    setMsDesc(ms?.desc ?? '');
    setShowMilestoneModal(true);
  };

  const saveMilestone = () => {
    if (!msTitle || !msDate) return;
    if (editingMilestone) {
      setMilestones((p) =>
        p.map((m) =>
          m.id === editingMilestone.id ? { ...m, icon: msIcon, date: msDate, title: msTitle, desc: msDesc } : m,
        ),
      );
    } else {
      setMilestones((p) => [
        ...p,
        { id: `ms-${Date.now()}`, icon: msIcon, date: msDate, title: msTitle, desc: msDesc },
      ]);
    }
    setShowMilestoneModal(false);
  };

  const latestEng = INV_ENGAGEMENT[INV_ENGAGEMENT.length - 1]!;
  const dauMauRatio = ((latestEng.dau / latestEng.mau) * 100).toFixed(1);
  const latestUG = INV_USER_GROWTH[INV_USER_GROWTH.length - 1]!;
  const churnRate = ((latestUG.churned / latestUG.total) * 100).toFixed(1);
  const netGrowth = latestUG.newUsers - latestUG.churned;
  const avgChurn = (
    INV_USER_GROWTH.reduce((s, d) => s + (d.churned / d.total) * 100, 0) / INV_USER_GROWTH.length
  ).toFixed(1);
  const latestSG = INV_SHOP_GROWTH[INV_SHOP_GROWTH.length - 1]!;
  const latestRev = FIN_REVENUE[FIN_REVENUE.length - 1]!;

  const inputCls = 'w-full rounded-lg text-[13px] outline-none box-border';

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tab pills */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            type="button"
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={clsx(
              'rounded-[20px] px-[18px] py-[7px] text-xs font-bold',
              subTab === t.key ? 'bg-primary border-none text-white' : 'bg-surface text-text-muted',
            )}
            style={subTab !== t.key ? { border: `1.5px solid ${C.border}` } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* METRICS */}
      {subTab === 'metrics' && (
        <>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[
              { l: 'DAU', v: latestEng.dau },
              { l: 'WAU', v: latestEng.wau },
              { l: 'MAU', v: latestEng.mau },
              { l: 'DAU/MAU Ratio', v: `${dauMauRatio}%` },
            ].map((k) => (
              <div key={k.l} className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
                <div className={`${kLCls} text-text-muted`}>{k.l}</div>
                <div className={`${kVCls} text-text`}>{typeof k.v === 'number' ? k.v.toLocaleString() : k.v}</div>
              </div>
            ))}
          </div>

          {/* Engagement Trend */}
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Engagement Trend (DAU)</div>
            {(() => {
              const vals = INV_ENGAGEMENT.map((d) => d.dau);
              const { line, area } = buildSvgPath(vals, 500, 150);
              return (
                <svg viewBox="0 0 500 150" className="h-auto w-full">
                  <defs>
                    <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.primary} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#engGrad)" />
                  <path d={line} fill="none" stroke={C.primary} strokeWidth={2.5} />
                  {INV_ENGAGEMENT.map((d, i) => {
                    const x = 10 + i * (480 / (INV_ENGAGEMENT.length - 1));
                    return (
                      <text key={i} x={x} y={148} textAnchor="middle" fontSize={8} fill={C.textDim}>
                        {ML(d.month)}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* Conversion Funnel */}
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Conversion Funnel (Latest Month)</div>
            {(() => {
              const steps = [
                { label: 'Visits', value: latestEng.visits },
                { label: 'Signups', value: latestEng.signups },
                { label: 'Activated', value: latestEng.activated },
                { label: 'Paid', value: latestEng.paidConv },
              ];
              return (
                <div className="flex flex-col gap-1">
                  {steps.map((s, i) => {
                    const wPct = (s.value / steps[0]!.value) * 100;
                    const prev = i > 0 ? steps[i - 1]!.value : null;
                    const conv = prev ? ((s.value / prev) * 100).toFixed(1) : null;
                    return (
                      <div key={s.label}>
                        {conv && <div className="text-text-dim my-0.5 text-center text-[10px]">{conv}% conversion</div>}
                        <div
                          className={clsx(
                            'mx-auto flex min-w-[80px] justify-between rounded-lg px-3.5 py-2.5 text-[13px] font-bold',
                            i >= 2 ? 'text-white' : 'text-text',
                          )}
                          style={{
                            width: `${wPct}%`,
                            background: `${C.primary}${['22', '33', '55', '88'][i]}`,
                          }}
                        >
                          <span>{s.label}</span>
                          <span>{s.value.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* GROWTH */}
      {subTab === 'growth' && (
        <>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
            {[
              { l: 'Total Users', v: latestUG.total.toLocaleString() },
              { l: 'Active Users', v: latestUG.active.toLocaleString() },
              { l: 'New This Month', v: `+${latestUG.newUsers}` },
              { l: 'Churned This Month', v: String(latestUG.churned) },
              { l: 'Monthly Churn Rate', v: `${churnRate}%` },
              { l: 'Net Growth', v: `+${netGrowth}` },
            ].map((k) => (
              <div key={k.l} className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
                <div className={`${kLCls} text-text-muted`}>{k.l}</div>
                <div className={`${kVCls} text-text`}>{k.v}</div>
              </div>
            ))}
          </div>

          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Growth Trajectory (Total Users)</div>
            {(() => {
              const vals = INV_USER_GROWTH.map((d) => d.total);
              const { line, area } = buildSvgPath(vals, 500, 150);
              return (
                <svg viewBox="0 0 500 150" className="h-auto w-full">
                  <defs>
                    <linearGradient id="growGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.success} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.success} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <path d={area} fill="url(#growGrad)" />
                  <path d={line} fill="none" stroke={C.success} strokeWidth={2.5} />
                  {INV_USER_GROWTH.map((d, i) => {
                    const x = 10 + i * (480 / (INV_USER_GROWTH.length - 1));
                    return (
                      <text key={i} x={x} y={148} textAnchor="middle" fontSize={8} fill={C.textDim}>
                        {ML(d.month)}
                      </text>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          {/* Cohort Retention Table */}
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Cohort Retention (%)</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr>
                    <th
                      className="text-text px-2.5 py-1.5 text-left font-bold"
                      style={{ borderBottom: `1.5px solid ${C.border}` }}
                    >
                      Cohort
                    </th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th
                        key={i}
                        className="text-text-muted px-2.5 py-1.5 text-center font-bold"
                        style={{ borderBottom: `1.5px solid ${C.border}` }}
                      >
                        M{i}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {INV_COHORT_RETENTION.map((row) => (
                    <tr key={row.cohort}>
                      <td className="text-text px-2.5 py-1.5 font-semibold whitespace-nowrap">{row.cohort}</td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const val = row[`m${i}` as keyof typeof row] as number | undefined;
                        const bg =
                          val === undefined
                            ? 'transparent'
                            : val >= 70
                              ? 'rgba(16,185,129,0.15)'
                              : val >= 50
                                ? 'rgba(245,158,11,0.15)'
                                : 'rgba(239,68,68,0.15)';
                        return (
                          <td key={i} className="text-text px-2.5 py-1.5 text-center" style={{ background: bg }}>
                            {val !== undefined ? `${val}%` : '\u2014'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Churn Analysis */}
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Churn Analysis</div>
            <div className="flex items-center gap-3.5">
              <div className="bg-danger/[0.09] flex h-11 w-11 items-center justify-center rounded-full">
                <BarChart3 size={20} color={C.danger} />
              </div>
              <div>
                <div className={`${kLCls} text-text-muted`}>Average Monthly Churn Rate</div>
                <div className="text-danger text-[28px] font-black">{avgChurn}%</div>
                <div className="text-text-dim text-[11px]">Calculated across {INV_USER_GROWTH.length} months</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* USERS & SHOPS */}
      {subTab === 'usersShops' && (
        <>
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>User Statistics</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="bg-primary/[0.06] rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Total Users</div>
                <div className={`${kVCls} text-text`}>{latestUG.total}</div>
              </div>
              <div className="bg-success/[0.06] rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Active Users</div>
                <div className={`${kVCls} text-text`}>{latestUG.active}</div>
              </div>
              <div className="bg-accent/[0.06] rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>By Plan</div>
                <div className="mt-2 flex h-[22px] gap-1 overflow-hidden rounded-md">
                  {[
                    { l: 'Free', c: latestUG.free, co: C.textDim },
                    { l: 'Basic', c: latestUG.basic, co: C.primary },
                    { l: 'Max', c: latestUG.max, co: C.accent },
                  ].map((s) => (
                    <div
                      key={s.l}
                      title={`${s.l}: ${s.c}`}
                      className="flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ flex: s.c, background: s.co }}
                    >
                      {s.c}
                    </div>
                  ))}
                </div>
                <div className="text-text-dim mt-1.5 flex gap-2.5 text-[10px]">
                  <span>Free: {latestUG.free}</span>
                  <span>Basic: {latestUG.basic}</span>
                  <span>Max: {latestUG.max}</span>
                </div>
              </div>
            </div>
            <MiniChart data={INV_USER_GROWTH.map((d) => d.total)} color={C.primary ?? ''} id="usrGrad" />
          </div>

          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Shop Statistics</div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div className="bg-accent/[0.06] rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Total Shops</div>
                <div className={`${kVCls} text-text`}>{latestSG.total}</div>
              </div>
              <div className="bg-success/[0.06] rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Active Shops</div>
                <div className={`${kVCls} text-text`}>{latestSG.active}</div>
              </div>
              <div className="bg-warning/[0.06] rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>By Type</div>
                <div className="mt-2 flex h-[22px] gap-1 overflow-hidden rounded-md">
                  {[
                    { l: 'Retail', c: latestSG.retail, co: C.primary },
                    { l: 'Wholesale', c: latestSG.wholesale, co: C.accent },
                    { l: 'Restaurant', c: latestSG.restaurant, co: C.warning },
                    { l: 'Pharmacy', c: latestSG.pharmacy, co: C.success },
                    { l: 'Other', c: latestSG.other, co: C.textDim },
                  ].map((s) => (
                    <div
                      key={s.l}
                      title={`${s.l}: ${s.c}`}
                      className="flex items-center justify-center text-[8px] font-bold text-white"
                      style={{ flex: s.c, background: s.co }}
                    >
                      {s.c}
                    </div>
                  ))}
                </div>
                <div className="text-text-dim mt-1.5 flex flex-wrap gap-2 text-[10px]">
                  <span>Retail: {latestSG.retail}</span>
                  <span>Wholesale: {latestSG.wholesale}</span>
                  <span>Restaurant: {latestSG.restaurant}</span>
                  <span>Pharmacy: {latestSG.pharmacy}</span>
                  <span>Other: {latestSG.other}</span>
                </div>
              </div>
            </div>
            <MiniChart data={INV_SHOP_GROWTH.map((d) => d.total)} color={C.accent ?? ''} id="shpGrad" />
          </div>

          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Platform Depth</div>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              <div className="bg-surface rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Avg Products / Shop</div>
                <div className={`${kVCls} text-text`}>~15</div>
              </div>
              <div className="bg-surface rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Avg Team / Shop</div>
                <div className={`${kVCls} text-text`}>~4</div>
              </div>
              <div className="bg-surface rounded-[10px] p-3.5">
                <div className={`${kLCls} text-text-muted`}>Est. Total Products</div>
                <div className={`${kVCls} text-text`}>~{(latestSG.total * 15).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DECK */}
      {subTab === 'deck' && (
        <>
          {/* Company Snapshot */}
          <div
            className={cardCls}
            style={{
              background: `linear-gradient(135deg, ${C.primary}18, ${C.accent}18)`,
              border: `1.5px solid ${C.border}`,
            }}
          >
            <div className="text-text mb-1 text-xl font-black">ShopChain</div>
            <div className="text-text-dim mb-4 text-[13px]">
              All-in-one inventory & business management for African shops
            </div>
            <div className="grid grid-cols-3 gap-3.5">
              <div>
                <div className={`${kLCls} text-text-muted`}>Total Users</div>
                <div className="text-primary text-[22px] font-black">{latestUG.total}</div>
              </div>
              <div>
                <div className={`${kLCls} text-text-muted`}>Total Shops</div>
                <div className="text-accent text-[22px] font-black">{latestSG.total}</div>
              </div>
              <div>
                <div className={`${kLCls} text-text-muted`}>MRR</div>
                <div className="text-success text-[22px] font-black">
                  {'\u20B5'}
                  {latestRev.subscriptions.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className={`${sTCls} text-text`}>Key Metrics Summary</div>
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {[
                  ['DAU', latestEng.dau.toLocaleString()],
                  ['WAU', latestEng.wau.toLocaleString()],
                  ['MAU', latestEng.mau.toLocaleString()],
                  ['MRR', `\u20B5${latestRev.subscriptions.toLocaleString()}`],
                  ['ARPU', `\u20B5${latestUG.total > 0 ? (latestRev.subscriptions / latestUG.total).toFixed(2) : '0'}`],
                  ['Total Users', latestUG.total.toLocaleString()],
                  ['Total Shops', latestSG.total.toLocaleString()],
                  ['Churn Rate', `${churnRate}%`],
                  ['Net Growth', `+${netGrowth}`],
                  ['Retention M3', `${INV_COHORT_RETENTION[0]?.m3 ?? '-'}%`],
                  ['DAU/MAU Ratio', `${dauMauRatio}%`],
                  ['Paid Conversions', latestEng.paidConv.toLocaleString()],
                ].map(([m, v], i) => (
                  <tr key={m} style={{ background: i % 2 === 0 ? 'transparent' : C.border + '30' }}>
                    <td className="text-text-muted px-3 py-2 font-semibold">{m}</td>
                    <td className="text-text px-3 py-2 text-right font-extrabold">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Milestones Timeline */}
          <div className={`${cardCls} bg-surface`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className="mb-[18px] flex items-center justify-between">
              <div className={`${sTCls} text-text`}>Milestones</div>
              <button
                type="button"
                onClick={() => openModal()}
                className="bg-primary flex items-center gap-1.5 rounded-lg border-none px-3.5 py-1.5 text-xs font-bold text-white"
              >
                <Plus size={14} /> Add Milestone
              </button>
            </div>
            <div className="relative pl-8">
              <div className="absolute w-0.5" style={{ left: 11, top: 4, bottom: 4, background: C.border }} />
              {milestones.map((ms, i) => (
                <div
                  key={ms.id}
                  onClick={() => openModal(ms)}
                  className="relative cursor-pointer pl-3"
                  style={{
                    marginBottom: i < milestones.length - 1 ? 22 : 0,
                  }}
                >
                  <div
                    className="absolute h-3.5 w-3.5 rounded-full"
                    style={{
                      left: -27,
                      top: 4,
                      background: C.primary,
                      border: `2px solid ${C.surface}`,
                    }}
                  />
                  <div className="flex items-start gap-2.5">
                    <span className="text-[22px]">{ms.icon}</span>
                    <div>
                      <div className="text-text text-[13px] font-bold">{ms.title}</div>
                      <div className="text-text-dim text-[11px]">{ms.date}</div>
                      <div className="text-text-muted mt-0.5 text-xs">{ms.desc}</div>
                    </div>
                    <Edit3 size={13} color={C.textDim} className="mt-0.5 ml-auto shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MILESTONE MODAL */}
      {showMilestoneModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/45 p-4"
          onClick={() => setShowMilestoneModal(false)}
        >
          <div
            className="bg-surface w-full max-w-[420px] rounded-2xl p-6"
            style={{
              border: `1.5px solid ${C.border}`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <div className="text-text text-base font-extrabold">
                {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                aria-label="Close"
                className="border-none bg-transparent p-1"
              >
                <X size={18} color={C.textMuted} />
              </button>
            </div>

            <div className="mb-3.5">
              <div className="text-text-muted mb-1.5 text-[11px] font-bold">Icon</div>
              <div className="grid grid-cols-8 gap-1.5">
                {MILESTONE_ICONS.map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    onClick={() => setMsIcon(icon)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-lg"
                    style={{
                      border: msIcon === icon ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`,
                      background: msIcon === icon ? C.primary + '18' : 'transparent',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3.5">
              <div className="text-text-muted mb-1.5 text-[11px] font-bold">Date</div>
              <input
                type="date"
                value={msDate}
                onChange={(e) => setMsDate(e.target.value)}
                className={`${inputCls} bg-bg text-text px-3 py-2`}
                style={{ border: `1.5px solid ${C.border}` }}
              />
            </div>
            <div className="mb-3.5">
              <div className="text-text-muted mb-1.5 text-[11px] font-bold">Title</div>
              <input
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                placeholder="Milestone title"
                className={`${inputCls} bg-bg text-text px-3 py-2`}
                style={{ border: `1.5px solid ${C.border}` }}
              />
            </div>
            <div className="mb-[18px]">
              <div className="text-text-muted mb-1.5 text-[11px] font-bold">Description</div>
              <textarea
                value={msDesc}
                onChange={(e) => setMsDesc(e.target.value)}
                rows={3}
                placeholder="Brief description..."
                className={`${inputCls} bg-bg text-text resize-y px-3 py-2 font-[inherit]`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="text-text-muted rounded-lg bg-transparent px-[18px] py-2 text-xs font-bold"
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMilestone}
                className={clsx(
                  'bg-primary rounded-lg border-none px-[18px] py-2 text-xs font-bold text-white',
                  !(msTitle && msDate) && 'opacity-50',
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
