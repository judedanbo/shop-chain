import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { DollarSign, TrendingUp, TrendingDown, Receipt, BarChart3, FileText, Plus, Trash2, X } from 'lucide-react';
import type { ExpenseItem, ExpenseCategory } from '@/types/admin.types';
import {
  FIN_MONTH_LABELS,
  FIN_REVENUE,
  FIN_EXPENSES,
  FIN_EXPENSE_CATEGORIES,
  FIN_EXPENSE_DETAIL,
  GH_TAX,
  FIN_CASHFLOW_OTHER,
  FIN_REPORT_TYPES,
  FIN_SCHEDULED_REPORTS,
} from '@/constants/adminFinances';
import type { AdminThemeColors } from '@/constants/adminThemes';

// ─── Types ────────────────────────────────────────────────────
interface AdminFinancesTabProps {
  C: AdminThemeColors;
}

type FinSubTab = 'dashboard' | 'revenue' | 'expenses' | 'cashflow' | 'projections' | 'reports';

const SUB_TABS: { id: FinSubTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'cashflow', label: 'Cash Flow' },
  { id: 'projections', label: 'Projections' },
  { id: 'reports', label: 'Reports' },
];

const EXPENSE_CATS = Object.keys(FIN_EXPENSE_CATEGORIES) as ExpenseCategory[];

// ─── Helpers ──────────────────────────────────────────────────
function sumExpMonth(m: (typeof FIN_EXPENSES)[number]): number {
  return m.infrastructure + m.paymentFees + m.sms + m.staff + m.marketing + m.software + m.office + m.compliance;
}

function fmtGhs(v: number): string {
  return `\u20B5${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Component ────────────────────────────────────────────────
export function AdminFinancesTab({ C }: AdminFinancesTabProps) {
  // ── State ───────────────────────────────────────────────────
  const [subTab, setSubTab] = useState<FinSubTab>('dashboard');
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>(() => [...FIN_EXPENSE_DETAIL]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [projGrowth, setProjGrowth] = useState(15);
  const [projChurn, setProjChurn] = useState(5);
  const [projExpGrowth, setProjExpGrowth] = useState(8);
  const [reportPeriod, setReportPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [reportBasis, setReportBasis] = useState<'cash' | 'accrual'>('cash');
  const [startupRebate, setStartupRebate] = useState(true);

  // ── Expense modal form state ────────────────────────────────
  const [formCat, setFormCat] = useState<ExpenseCategory>('infrastructure');
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formVendor, setFormVendor] = useState('');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formRef, setFormRef] = useState('');

  // ── Shared className strings ──────────────────────────────────
  const cardCls = 'rounded-[14px]';
  const sectionTitleCls = 'text-sm font-bold mb-3';
  const inputCls = 'w-full rounded-[10px] text-[13px] font-[inherit] outline-none box-border';
  const labelCls = 'text-[11px] font-bold mb-1 block';

  // ── Aggregated data ─────────────────────────────────────────
  const totalRevenue = useMemo(() => FIN_REVENUE.reduce((s, r) => s + r.subscriptions, 0), []);
  const monthlyExpTotals = useMemo(() => FIN_EXPENSES.map(sumExpMonth), []);
  const totalExpenses = useMemo(() => monthlyExpTotals.reduce((s, v) => s + v, 0), [monthlyExpTotals]);
  const netIncome = totalRevenue - totalExpenses;
  const runway = totalRevenue > 0 ? Math.round(netIncome / (totalExpenses / 12)) : 0;
  const lastMonthExp = FIN_EXPENSES[FIN_EXPENSES.length - 1]!;
  const lastMonthRev = FIN_REVENUE[FIN_REVENUE.length - 1]!;

  // ── Expense modal helpers ───────────────────────────────────
  const openAddExpense = () => {
    setEditingExpense(null);
    setFormCat('infrastructure');
    setFormDate('');
    setFormAmount('');
    setFormDesc('');
    setFormVendor('');
    setFormRecurring(false);
    setFormRef('');
    setShowExpenseModal(true);
  };

  const saveExpense = () => {
    if (!formDesc.trim() || !formAmount) return;
    const item: ExpenseItem = {
      id: editingExpense?.id ?? `ex-${Date.now()}`,
      date: formDate || new Date().toISOString().slice(0, 10),
      category: formCat,
      desc: formDesc,
      amount: parseFloat(formAmount) || 0,
      vendor: formVendor,
      recurring: formRecurring,
      ref: formRef,
      attachments: editingExpense?.attachments ?? [],
    };
    if (editingExpense) {
      setExpenseItems((prev) => prev.map((e) => (e.id === editingExpense.id ? item : e)));
    } else {
      setExpenseItems((prev) => [item, ...prev]);
    }
    setShowExpenseModal(false);
    setEditingExpense(null);
  };

  // ── KPI card renderer ───────────────────────────────────────
  const kpiCard = (label: string, value: string, color: string, icon: React.ReactNode) => (
    <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
      <div className="flex items-center gap-3">
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full"
          style={{ background: color + '18' }}
        >
          {icon}
        </div>
        <div>
          <div className="form-label text-text-muted tracking-[0.5px]">{label}</div>
          <div className="text-text text-[22px] font-black">{value}</div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 1: Dashboard
  // ═══════════════════════════════════════════════════════════
  const renderDashboard = () => {
    const maxVal = Math.max(...FIN_REVENUE.map((r) => r.subscriptions), ...monthlyExpTotals);
    const chartH = 160;
    const barW = 16;
    const gap = 4;
    const groupW = barW * 2 + gap;
    const chartW = 600;
    const leftPad = 10;
    const scale = (v: number) => (maxVal > 0 ? (v / maxVal) * chartH : 0);

    const prevRev = FIN_REVENUE.length >= 2 ? FIN_REVENUE[FIN_REVENUE.length - 2]!.subscriptions : 0;
    const momGrowth = prevRev > 0 ? (((lastMonthRev.subscriptions - prevRev) / prevRev) * 100).toFixed(1) : '0.0';
    const prevExp = monthlyExpTotals.length >= 2 ? monthlyExpTotals[monthlyExpTotals.length - 2]! : 0;
    const expGrowthPct =
      prevExp > 0 ? (((monthlyExpTotals[monthlyExpTotals.length - 1]! - prevExp) / prevExp) * 100).toFixed(1) : '0.0';

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4">
          {kpiCard('Total Revenue', fmtGhs(totalRevenue), C.success ?? '', <DollarSign size={18} color={C.success} />)}
          {kpiCard(
            'Total Expenses',
            fmtGhs(totalExpenses),
            C.danger ?? '',
            <TrendingDown size={18} color={C.danger} />,
          )}
          {kpiCard('Net Income', fmtGhs(netIncome), '#3B82F6', <TrendingUp size={18} color="#3B82F6" />)}
          {kpiCard('Runway', `${runway} months`, C.warning ?? '', <BarChart3 size={18} color={C.warning} />)}
        </div>

        {/* MoM quick stats */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div
            className={`${cardCls} bg-surface flex items-center gap-3 p-[18px]`}
            style={{ border: `1.5px solid ${C.border}` }}
          >
            <TrendingUp size={16} color={C.success} />
            <div>
              <div className="text-text-muted text-[11px] font-semibold">Revenue MoM Growth</div>
              <div className={clsx('text-lg font-black', Number(momGrowth) >= 0 ? 'text-success' : 'text-danger')}>
                {Number(momGrowth) >= 0 ? '+' : ''}
                {momGrowth}%
              </div>
            </div>
          </div>
          <div
            className={`${cardCls} bg-surface flex items-center gap-3 p-[18px]`}
            style={{ border: `1.5px solid ${C.border}` }}
          >
            <TrendingDown size={16} color={C.warning} />
            <div>
              <div className="text-text-muted text-[11px] font-semibold">Expense MoM Growth</div>
              <div className={clsx('text-lg font-black', Number(expGrowthPct) <= 0 ? 'text-success' : 'text-warning')}>
                {Number(expGrowthPct) >= 0 ? '+' : ''}
                {expGrowthPct}%
              </div>
            </div>
          </div>
        </div>

        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className="mb-3 flex items-center gap-4">
            <div className="text-text text-[13px] font-extrabold">Revenue vs Expenses (12 months)</div>
            <div className="ml-auto flex gap-3">
              <div className="flex items-center gap-1">
                <div className="bg-success h-2.5 w-2.5 rounded-sm" />
                <span className="text-text-dim text-[10px]">Revenue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-danger h-2.5 w-2.5 rounded-sm" />
                <span className="text-text-dim text-[10px]">Expenses</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 600 200" className="h-auto w-full">
            {FIN_REVENUE.map((r, i) => {
              const x = leftPad + i * ((chartW - leftPad * 2) / 12) + ((chartW - leftPad * 2) / 12 - groupW) / 2;
              const revH = scale(r.subscriptions);
              const expH = scale(monthlyExpTotals[i]!);
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={chartH - revH + 10}
                    width={barW}
                    height={revH}
                    rx={3}
                    fill={C.success}
                    opacity={0.85}
                  />
                  <rect
                    x={x + barW + gap}
                    y={chartH - expH + 10}
                    width={barW}
                    height={expH}
                    rx={3}
                    fill={C.danger}
                    opacity={0.85}
                  />
                  <text x={x + groupW / 2} y={190} textAnchor="middle" fontSize={8} fill={C.textDim}>
                    {FIN_MONTH_LABELS[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Monthly summary table */}
        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className="text-text mb-2.5 text-[13px] font-extrabold">Monthly Summary</div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  {['Month', 'Revenue', 'Expenses', 'Net', 'Margin'].map((h) => (
                    <th
                      key={h}
                      className="text-text-muted px-2.5 py-1.5 text-left text-[10px] font-bold"
                      style={{ borderBottom: `1.5px solid ${C.border}` }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIN_REVENUE.map((r, i) => {
                  const exp = monthlyExpTotals[i]!;
                  const net = r.subscriptions - exp;
                  const margin = r.subscriptions > 0 ? ((net / r.subscriptions) * 100).toFixed(0) : '0';
                  return (
                    <tr key={r.month} className={clsx(i % 2 !== 0 && 'bg-surface-alt')}>
                      <td className="text-text px-2.5 py-1.5 font-semibold">{FIN_MONTH_LABELS[i]}</td>
                      <td className="text-success px-2.5 py-1.5">{fmtGhs(r.subscriptions)}</td>
                      <td className="text-danger px-2.5 py-1.5">{fmtGhs(exp)}</td>
                      <td className={clsx('px-2.5 py-1.5 font-bold', net >= 0 ? 'text-success' : 'text-danger')}>
                        {fmtGhs(net)}
                      </td>
                      <td className={clsx('px-2.5 py-1.5', Number(margin) >= 0 ? 'text-success' : 'text-danger')}>
                        {margin}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 2: Revenue
  // ═══════════════════════════════════════════════════════════
  const renderRevenue = () => {
    const plans = [
      { name: 'Free', users: 120, price: 0, color: '#6B7280' },
      { name: 'Basic', users: 85, price: 29, color: '#3B82F6' },
      { name: 'Max', users: 42, price: 79, color: '#8B5CF6' },
    ];
    const totalMomo = FIN_REVENUE.reduce((s, r) => s + r.momoFees, 0);
    const totalCard = FIN_REVENUE.reduce((s, r) => s + r.cardFees, 0);
    const last3 = FIN_REVENUE.slice(-3);

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className={`${sectionTitleCls} text-text`}>Revenue by Plan</div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`${cardCls} bg-surface p-[18px]`}
              style={{ border: `1.5px solid ${C.border}` }}
            >
              <div className="mb-1 text-xs font-bold" style={{ color: p.color }}>
                {p.name} Plan
              </div>
              <div className="text-text text-[22px] font-black">{fmtGhs(p.users * p.price)}</div>
              <div className="text-text-dim text-[11px]">
                {p.users} users x {fmtGhs(p.price)}/mo
              </div>
            </div>
          ))}
        </div>

        <div className={`${sectionTitleCls} text-text`}>Revenue by Payment Method</div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-warning mb-1 text-xs font-bold">Mobile Money Fees</div>
                <div className="text-text text-[22px] font-black">{fmtGhs(totalMomo)}</div>
              </div>
              <div className="text-warning bg-warning-bg rounded-md px-2 py-[3px] text-[11px] font-extrabold">
                {totalMomo + totalCard > 0 ? ((totalMomo / (totalMomo + totalCard)) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-text-dim mt-1 text-[11px]">Total MoMo processing fees (12 months)</div>
          </div>
          <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs font-bold text-[#8B5CF6]">Card Fees</div>
                <div className="text-text text-[22px] font-black">{fmtGhs(totalCard)}</div>
              </div>
              <div
                className="rounded-md px-2 py-[3px] text-[11px] font-extrabold text-[#8B5CF6]"
                style={{ background: '#8B5CF618' }}
              >
                {totalMomo + totalCard > 0 ? ((totalCard / (totalMomo + totalCard)) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-text-dim mt-1 text-[11px]">Total card processing fees (12 months)</div>
          </div>
        </div>

        <div className={`${sectionTitleCls} text-text`}>Transaction Ledger (Last 3 Months)</div>
        <div className={`${cardCls} bg-surface overflow-x-auto p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {['Month', 'Subscriptions', 'Signups', 'Failed', 'Refunds'].map((h) => (
                  <th
                    key={h}
                    className="text-text-muted px-3 py-2 text-left text-[11px] font-bold"
                    style={{ borderBottom: `1.5px solid ${C.border}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {last3.map((r, i) => (
                <tr key={r.month} className={clsx(i % 2 !== 0 && 'bg-surface-alt')}>
                  <td className="text-text px-3 py-2 font-semibold">{r.month}</td>
                  <td className="text-success px-3 py-2 font-bold">{fmtGhs(r.subscriptions)}</td>
                  <td className="text-text px-3 py-2">{r.signups}</td>
                  <td className="text-danger px-3 py-2">{fmtGhs(r.failed)}</td>
                  <td className="text-warning px-3 py-2">{fmtGhs(r.refunds)}</td>
                </tr>
              ))}
              <tr style={{ borderTop: `2px solid ${C.border}` }}>
                <td className="text-text px-3 py-2 text-xs font-extrabold">Total</td>
                <td className="text-success px-3 py-2 font-extrabold">
                  {fmtGhs(last3.reduce((s, r) => s + r.subscriptions, 0))}
                </td>
                <td className="text-text px-3 py-2 font-bold">{last3.reduce((s, r) => s + r.signups, 0)}</td>
                <td className="text-danger px-3 py-2 font-bold">{fmtGhs(last3.reduce((s, r) => s + r.failed, 0))}</td>
                <td className="text-warning px-3 py-2 font-bold">{fmtGhs(last3.reduce((s, r) => s + r.refunds, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 3: Expenses
  // ═══════════════════════════════════════════════════════════
  const renderExpenses = () => {
    const lastExp = lastMonthExp;

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className={`${sectionTitleCls} text-text`}>Category Summary (Current Month)</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EXPENSE_CATS.map((key) => {
            const cat = FIN_EXPENSE_CATEGORIES[key]!;
            const val = (lastExp as unknown as Record<string, number>)[key] ?? 0;
            return (
              <div key={key} className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
                <div className="mb-1 text-lg">{cat.icon}</div>
                <div className="text-[11px] font-bold" style={{ color: cat.color }}>
                  {cat.label}
                </div>
                <div className="text-text text-xl font-black">{fmtGhs(val)}</div>
              </div>
            );
          })}
        </div>

        <div className="-mb-2 flex items-center justify-between">
          <div className={`${sectionTitleCls} text-text`}>Expense Items</div>
          <button
            type="button"
            onClick={openAddExpense}
            className="bg-primary flex items-center gap-1.5 rounded-[10px] border-none px-4 py-2 font-[inherit] text-xs font-bold text-white"
          >
            <Plus size={14} /> Add Expense
          </button>
        </div>

        <div className={`${cardCls} bg-surface overflow-x-auto p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {['Date', 'Category', 'Description', 'Vendor', 'Amount', '', 'Ref', ''].map((h, hi) => (
                  <th
                    key={hi}
                    className="text-text-muted px-2.5 py-2 text-left text-[10px] font-bold whitespace-nowrap"
                    style={{ borderBottom: `1.5px solid ${C.border}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenseItems.map((ex, i) => {
                const cat = FIN_EXPENSE_CATEGORIES[ex.category];
                return (
                  <tr key={ex.id} className={clsx(i % 2 !== 0 && 'bg-surface-alt')}>
                    <td className="text-text-dim px-2.5 py-2 whitespace-nowrap">{ex.date}</td>
                    <td className="px-2.5 py-2 whitespace-nowrap">
                      <span className="mr-1">{cat?.icon}</span>
                      <span className="text-[11px] font-semibold" style={{ color: cat?.color }}>
                        {cat?.label}
                      </span>
                    </td>
                    <td className="text-text px-2.5 py-2">{ex.desc}</td>
                    <td className="text-text-dim px-2.5 py-2">{ex.vendor}</td>
                    <td className="text-text px-2.5 py-2 font-bold">{fmtGhs(ex.amount)}</td>
                    <td className="px-2.5 py-2">
                      {ex.recurring && (
                        <span className="bg-primary-bg text-primary rounded-[5px] px-1.5 py-0.5 text-[9px] font-bold">
                          Recurring
                        </span>
                      )}
                    </td>
                    <td className="text-text-dim px-2.5 py-2 font-mono text-[10px]">{ex.ref}</td>
                    <td className="px-2.5 py-2">
                      <button
                        type="button"
                        onClick={() => setExpenseItems((prev) => prev.filter((e) => e.id !== ex.id))}
                        className="border-none bg-transparent p-0.5 opacity-60"
                        title="Delete expense"
                      >
                        <Trash2 size={13} color={C.danger} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 4: Cash Flow
  // ═══════════════════════════════════════════════════════════
  const renderCashFlow = () => {
    const revInflow = lastMonthRev.subscriptions;
    const expOutflow = sumExpMonth(lastMonthExp);
    const netOperating = revInflow - expOutflow;
    const { equipmentPurchase, devCosts, ownerInvestment, loanRepayment, dividends } = FIN_CASHFLOW_OTHER;
    const investingNet = -(equipmentPurchase + devCosts);
    const financingNet = ownerInvestment - loanRepayment - dividends;
    const netCashFlow = netOperating + investingNet + financingNet;
    const monthlyBurn = expOutflow + equipmentPurchase + devCosts + loanRepayment + dividends;
    const cashRunway =
      monthlyBurn > 0 ? Math.round(netCashFlow > 0 ? (revInflow + ownerInvestment) / monthlyBurn : 0) : 0;

    const cfRow = (label: string, amount: number, bold = false) => (
      <div
        className={clsx('flex justify-between py-1.5', bold ? 'mt-1 font-extrabold' : 'font-normal')}
        style={{
          borderTop: bold ? `1.5px solid ${C.border}` : 'none',
        }}
      >
        <span className={clsx('text-[13px]', bold ? 'text-text' : 'text-text-dim')}>{label}</span>
        <span className={clsx('text-[13px] font-bold', amount >= 0 ? 'text-success' : 'text-danger')}>
          {fmtGhs(amount)}
        </span>
      </div>
    );

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="text-text-muted -mb-2 text-[13px] font-bold">
          Cash Flow Statement &mdash; {lastMonthRev.month}
        </div>

        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className={`${sectionTitleCls} text-success`}>Operating Activities</div>
          {cfRow('Subscription Revenue (Inflow)', revInflow)}
          {cfRow('Operating Expenses (Outflow)', -expOutflow)}
          {cfRow('Net Operating Cash Flow', netOperating, true)}
        </div>

        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className={`${sectionTitleCls} text-[#3B82F6]`}>Investing Activities</div>
          {cfRow('Equipment Purchase', -equipmentPurchase)}
          {cfRow('Development Costs', -devCosts)}
          {cfRow('Net Investing Cash Flow', investingNet, true)}
        </div>

        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className={`${sectionTitleCls} text-warning`}>Financing Activities</div>
          {cfRow('Owner Investment', ownerInvestment)}
          {cfRow('Loan Repayment', -loanRepayment)}
          {cfRow('Dividends', -dividends)}
          {cfRow('Net Financing Cash Flow', financingNet, true)}
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {kpiCard(
            'Net Cash Flow',
            fmtGhs(netCashFlow),
            netCashFlow >= 0 ? (C.success ?? '') : (C.danger ?? ''),
            netCashFlow >= 0 ? <TrendingUp size={18} color={C.success} /> : <TrendingDown size={18} color={C.danger} />,
          )}
          {kpiCard('Runway (est.)', `${cashRunway} months`, C.warning ?? '', <BarChart3 size={18} color={C.warning} />)}
        </div>

        {/* Cash Waterfall Chart */}
        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className={`${sectionTitleCls} text-text`}>Cash Flow Waterfall</div>
          {(() => {
            const openingBalance = 12000;
            const closingBalance = openingBalance + netCashFlow;
            const waterfallItems = [
              { label: 'Opening Balance', value: openingBalance, type: 'total' as const },
              { label: 'Revenue', value: revInflow, type: 'positive' as const },
              { label: 'Expenses', value: -expOutflow, type: 'negative' as const },
              { label: 'Investing', value: investingNet, type: 'negative' as const },
              {
                label: 'Financing',
                value: financingNet,
                type: financingNet >= 0 ? ('positive' as const) : ('negative' as const),
              },
              { label: 'Closing Balance', value: closingBalance, type: 'total' as const },
            ];
            const maxAbs = Math.max(...waterfallItems.map((w) => Math.abs(w.value)));
            const barScale = maxAbs > 0 ? 100 / maxAbs : 1;
            return (
              <div className="flex flex-col gap-2">
                {waterfallItems.map((w) => {
                  const barPct = Math.abs(w.value) * barScale;
                  const barColor =
                    w.type === 'total'
                      ? (C.primary ?? '#3B82F6')
                      : w.type === 'positive'
                        ? (C.success ?? '#10B981')
                        : (C.danger ?? '#EF4444');
                  return (
                    <div key={w.label} className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-[110px] shrink-0 text-right text-xs',
                          w.type === 'total' ? 'text-text font-bold' : 'text-text-muted font-medium',
                        )}
                      >
                        {w.label}
                      </div>
                      <div className="bg-surface-alt relative h-5 flex-1 overflow-hidden rounded">
                        <div
                          className="h-full rounded transition-[width] duration-300"
                          style={{ width: `${barPct}%`, background: barColor }}
                        />
                      </div>
                      <div
                        className={clsx(
                          'w-[90px] shrink-0 text-right text-xs font-bold',
                          w.value >= 0 ? 'text-text' : 'text-danger',
                        )}
                      >
                        {fmtGhs(w.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Cash Runway Meter */}
        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className={`${sectionTitleCls} text-text`}>Cash Runway</div>
          <div className="mb-4 flex items-center gap-4">
            <div className="text-text text-[42px] font-black">{cashRunway}</div>
            <div>
              <div className="text-text-muted text-sm font-semibold">months</div>
              <div
                className={clsx(
                  'inline-block rounded-md px-2 py-0.5 text-xs font-bold',
                  cashRunway >= 12 ? 'text-success' : cashRunway >= 6 ? 'text-warning' : 'text-danger',
                )}
                style={{
                  background:
                    cashRunway >= 12 ? `${C.success}18` : cashRunway >= 6 ? `${C.warning}18` : `${C.danger}18`,
                }}
              >
                {cashRunway >= 12 ? 'Healthy' : cashRunway >= 6 ? 'Moderate' : 'Critical'}
              </div>
            </div>
          </div>
          <div
            className="relative h-3 overflow-hidden rounded-md"
            style={{
              background: `linear-gradient(to right, ${C.danger ?? '#EF4444'}, ${C.warning ?? '#F59E0B'}, ${C.success ?? '#10B981'})`,
            }}
          >
            <div
              className="absolute rounded-sm"
              style={{
                top: -4,
                left: `${Math.min((cashRunway / 24) * 100, 100)}%`,
                transform: 'translateX(-50%)',
                width: 4,
                height: 20,
                background: C.text,
                border: `2px solid ${C.surface}`,
              }}
            />
          </div>
          <div className="text-text-dim mt-1 flex justify-between text-[10px]">
            <span>0</span>
            <span>6 mo</span>
            <span>12 mo</span>
            <span>18 mo</span>
            <span>24+ mo</span>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 5: Projections
  // ═══════════════════════════════════════════════════════════
  const renderProjections = () => {
    const currentMRR = lastMonthRev.subscriptions;
    const projectedMRR = currentMRR * Math.pow(1 + projGrowth / 100, 12) * Math.pow(1 - projChurn / 100, 12);
    const projectedAnnualRevenue = projectedMRR * 12;
    const lastExpTotal = sumExpMonth(lastMonthExp);
    const projectedRunway =
      lastExpTotal > 0 ? Math.round(projectedAnnualRevenue / (lastExpTotal * 12 * (1 + projExpGrowth / 100))) : 0;

    const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, unit = '%') => (
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between">
          <span className="text-text text-xs font-bold">{label}</span>
          <span className="text-primary text-xs font-extrabold">
            {value}
            {unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => set(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: C.primary }}
        />
        <div className="text-text-dim flex justify-between text-[10px]">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className={`${sectionTitleCls} text-text`}>Projection Parameters</div>
          {slider('Growth Rate', projGrowth, setProjGrowth, 0, 50)}
          {slider('Churn Rate', projChurn, setProjChurn, 0, 20)}
          {slider('Expense Growth', projExpGrowth, setProjExpGrowth, 0, 30)}
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4">
          {kpiCard('Current MRR', fmtGhs(currentMRR), C.success ?? '', <DollarSign size={18} color={C.success} />)}
          {kpiCard(
            'Projected MRR (12mo)',
            fmtGhs(Math.round(projectedMRR)),
            '#3B82F6',
            <TrendingUp size={18} color="#3B82F6" />,
          )}
          {kpiCard(
            'Projected Annual Rev',
            fmtGhs(Math.round(projectedAnnualRevenue)),
            '#8B5CF6',
            <BarChart3 size={18} color="#8B5CF6" />,
          )}
          {kpiCard(
            'Projected Runway',
            `${projectedRunway} months`,
            C.warning ?? '',
            <Receipt size={18} color={C.warning} />,
          )}
        </div>

        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className="text-text mb-2.5 text-[13px] font-extrabold">MRR Growth Trajectory</div>
          <svg viewBox="0 0 600 120" className="h-auto w-full">
            {Array.from({ length: 13 }, (_, i) => {
              const mrr = currentMRR * Math.pow(1 + projGrowth / 100, i) * Math.pow(1 - projChurn / 100, i);
              const maxMRR = currentMRR * Math.pow(1 + projGrowth / 100, 12) * Math.pow(1 - projChurn / 100, 12);
              const displayMax = Math.max(maxMRR, currentMRR) * 1.1;
              const barH = displayMax > 0 ? (mrr / displayMax) * 90 : 0;
              const x = 20 + i * 44;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={100 - barH}
                    width={30}
                    height={barH}
                    rx={4}
                    fill={i === 0 ? C.success : '#3B82F6'}
                    opacity={0.7 + (i / 12) * 0.3}
                  />
                  <text x={x + 15} y={112} textAnchor="middle" fontSize={7} fill={C.textDim}>
                    M{i}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="text-text-dim mt-1.5 text-[11px]">
            Projected monthly recurring revenue over 12 months. Green bar = current. Blue bars = projected.
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // SUB-TAB 6: Reports (P&L)
  // ═══════════════════════════════════════════════════════════
  const renderReports = () => {
    const lastRev = lastMonthRev;
    const lastExp = lastMonthExp;
    const subscriptionRev = lastRev.subscriptions;
    const netRevenue = subscriptionRev - lastRev.failed - lastRev.refunds;
    const expTotal = sumExpMonth(lastExp);
    const grossProfit = netRevenue - expTotal;

    const corporateTax = grossProfit > 0 ? grossProfit * GH_TAX.corporateRate : 0;
    const rebateAmount = startupRebate ? corporateTax * GH_TAX.startupRebate : 0;
    const effectiveCorporateTax = corporateTax - rebateAmount;
    const nhil = grossProfit > 0 ? grossProfit * GH_TAX.nhil : 0;
    const getfl = grossProfit > 0 ? grossProfit * GH_TAX.getfl : 0;
    const covidLevy = grossProfit > 0 ? grossProfit * GH_TAX.covidLevy : 0;
    const vat = grossProfit > 0 ? grossProfit * GH_TAX.vat : 0;
    const totalTax = effectiveCorporateTax + nhil + getfl + covidLevy + vat;
    const netIncomeAfterTax = grossProfit - totalTax;

    const plRow = (label: string, value: number, opts?: { bold?: boolean; indent?: boolean; color?: string }) => (
      <div
        className={clsx('flex justify-between py-1.5', opts?.indent && 'pl-5', opts?.bold && 'mt-1.5')}
        style={{
          borderTop: opts?.bold ? `1.5px solid ${C.border}` : 'none',
        }}
      >
        <span className={clsx('text-[13px]', opts?.bold ? 'text-text font-extrabold' : 'text-text-dim font-normal')}>
          {label}
        </span>
        <span
          className={clsx('text-[13px]', opts?.bold ? 'font-black' : 'font-semibold')}
          style={{ color: opts?.color ?? (value >= 0 ? C.text : C.danger) }}
        >
          {fmtGhs(value)}
        </span>
      </div>
    );

    const toggleBtn = (label: string, active: boolean, onClick: () => void) => (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'rounded-lg px-3.5 py-1.5 font-[inherit] text-xs font-bold',
          active ? 'bg-primary-bg text-primary' : 'text-text-dim',
        )}
        style={{
          border: `1.5px solid ${active ? C.primary : C.border}`,
        }}
      >
        {label}
      </button>
    );

    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className={`${sectionTitleCls} text-text`}>Available Reports</div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
          {FIN_REPORT_TYPES.map((rt) => (
            <div key={rt.id} className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[22px]">{rt.icon}</span>
                <div className="text-text text-sm font-bold">{rt.title}</div>
              </div>
              <div className="text-text-dim mb-2.5 text-[11px]">{rt.desc}</div>
              <div className="text-text-muted mb-1.5 text-[10px] font-bold">Includes:</div>
              <ul className="m-0 mb-3 pl-4">
                {rt.includes.map((inc, i) => (
                  <li key={i} className="text-text-dim mb-0.5 text-[10px]">
                    {inc}
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                {rt.formats.map((fmt) => (
                  <button
                    type="button"
                    key={fmt}
                    className="bg-surface-alt text-text-muted border-border rounded-md border px-2.5 py-1 font-[inherit] text-[10px] font-semibold"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`${sectionTitleCls} text-text`}>Scheduled Reports</div>
        <div className={`${cardCls} bg-surface overflow-x-auto p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {['Report', 'Frequency', 'Recipient', 'Next Run', 'Enabled'].map((h) => (
                  <th
                    key={h}
                    className="text-text-muted px-2.5 py-2 text-left text-[10px] font-bold"
                    style={{ borderBottom: `1.5px solid ${C.border}` }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIN_SCHEDULED_REPORTS.map((sr, i) => (
                <tr key={sr.id} className={clsx(i % 2 !== 0 && 'bg-surface-alt')}>
                  <td className="text-text px-2.5 py-2 font-semibold">{sr.report}</td>
                  <td className="text-text-muted px-2.5 py-2">{sr.frequency}</td>
                  <td className="text-text-dim px-2.5 py-2 text-[11px]">{sr.recipient}</td>
                  <td className="text-text-muted px-2.5 py-2">{sr.nextRun}</td>
                  <td className="px-2.5 py-2">
                    <span
                      className={clsx(
                        'rounded-[5px] px-2 py-0.5 text-[10px] font-bold',
                        sr.enabled ? 'text-success' : 'text-text-dim',
                      )}
                      style={{
                        background: sr.enabled ? `${C.success}25` : `${C.textDim}18`,
                      }}
                    >
                      {sr.enabled ? 'Active' : 'Paused'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* P&L Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {toggleBtn('Monthly', reportPeriod === 'monthly', () => setReportPeriod('monthly'))}
            {toggleBtn('Quarterly', reportPeriod === 'quarterly', () => setReportPeriod('quarterly'))}
            {toggleBtn('Annual', reportPeriod === 'annual', () => setReportPeriod('annual'))}
          </div>
          <div className="flex gap-1.5">
            {toggleBtn('Cash', reportBasis === 'cash', () => setReportBasis('cash'))}
            {toggleBtn('Accrual', reportBasis === 'accrual', () => setReportBasis('accrual'))}
          </div>
          <label className="text-text flex cursor-pointer items-center gap-1.5 text-xs font-semibold">
            <input
              type="checkbox"
              checked={startupRebate}
              onChange={(e) => setStartupRebate(e.target.checked)}
              style={{ accentColor: C.primary }}
            />
            Startup Rebate (50%)
          </label>
        </div>

        <div className={`${cardCls} bg-surface p-[18px]`} style={{ border: `1.5px solid ${C.border}` }}>
          <div className="text-text mb-3 text-[15px] font-bold">Profit & Loss Statement</div>

          <div className="text-success mt-3 mb-3 text-xs font-bold">Revenue</div>
          {plRow('Subscription Revenue', subscriptionRev, { indent: true })}
          {plRow('Less: Failed Transactions', -lastRev.failed, { indent: true, color: C.danger })}
          {plRow('Less: Refunds', -lastRev.refunds, { indent: true, color: C.danger })}
          {plRow('Net Revenue', netRevenue, { bold: true, color: C.success })}

          <div className="text-danger mt-4 mb-3 text-xs font-bold">Cost of Operations</div>
          {EXPENSE_CATS.map((key) => {
            const cat = FIN_EXPENSE_CATEGORIES[key]!;
            const val = (lastExp as unknown as Record<string, number>)[key] ?? 0;
            return (
              <React.Fragment key={key}>{plRow(`${cat.icon} ${cat.label}`, val, { indent: true })}</React.Fragment>
            );
          })}
          {plRow('Total Expenses', expTotal, { bold: true, color: C.danger })}

          {plRow('Gross Profit', grossProfit, { bold: true, color: grossProfit >= 0 ? C.success : C.danger })}

          <div className="text-warning mt-4 mb-3 text-xs font-bold">Taxes (Ghana Revenue Authority)</div>
          {plRow('Corporate Tax (25%)', corporateTax, { indent: true })}
          {startupRebate && plRow('Startup Rebate (-50% corp.)', -rebateAmount, { indent: true, color: C.success })}
          {plRow('NHIL (2.5%)', nhil, { indent: true })}
          {plRow('GETFund (2.5%)', getfl, { indent: true })}
          {plRow('COVID-19 Levy (1%)', covidLevy, { indent: true })}
          {plRow('VAT (15%)', vat, { indent: true })}
          {plRow('Total Tax', totalTax, { bold: true, color: C.warning })}

          <div className="h-2" />
          {plRow('Net Income After Tax', netIncomeAfterTax, {
            bold: true,
            color: netIncomeAfterTax >= 0 ? C.success : C.danger,
          })}
        </div>

        {/* Report footer */}
        <div
          className={`${cardCls} bg-surface flex flex-wrap items-center gap-5 p-[18px]`}
          style={{ border: `1.5px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2">
            <FileText size={14} color={C.textDim} />
            <span className="text-text-dim text-[11px]">
              Period:{' '}
              <strong className="text-text">
                {reportPeriod === 'monthly'
                  ? lastMonthRev.month
                  : reportPeriod === 'quarterly'
                    ? 'Q4 2025-26'
                    : 'FY 2025-26'}
              </strong>
            </span>
          </div>
          <div className="text-text-dim text-[11px]">
            Basis: <strong className="text-text">{reportBasis === 'cash' ? 'Cash Basis' : 'Accrual Basis'}</strong>
          </div>
          <div className="text-text-dim text-[11px]">
            Effective Tax Rate:{' '}
            <strong className="text-warning">
              {grossProfit > 0 ? ((totalTax / grossProfit) * 100).toFixed(1) : '0.0'}%
            </strong>
          </div>
          <div className="text-text-dim text-[11px]">
            Net Margin:{' '}
            <strong className={clsx(netIncomeAfterTax >= 0 ? 'text-success' : 'text-danger')}>
              {subscriptionRev > 0 ? ((netIncomeAfterTax / subscriptionRev) * 100).toFixed(1) : '0.0'}%
            </strong>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Expense Modal
  // ═══════════════════════════════════════════════════════════
  const renderExpenseModal = () => {
    if (!showExpenseModal) return null;
    return (
      <div
        className="z-modal-backdrop fixed inset-0 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.55)' }} // backdrop
        onClick={() => setShowExpenseModal(false)}
      >
        <div
          className="bg-surface max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-[18px] p-6"
          style={{ border: `1.5px solid ${C.border}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-[18px] flex items-center justify-between">
            <div className="text-text text-base font-extrabold">{editingExpense ? 'Edit Expense' : 'Add Expense'}</div>
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              aria-label="Close"
              className="border-none bg-transparent p-1"
            >
              <X size={18} color={C.textDim} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className={`${labelCls} text-text-muted`}>Category</label>
              <select
                value={formCat}
                onChange={(e) => setFormCat(e.target.value as ExpenseCategory)}
                className={`${inputCls} bg-surface-alt text-text px-3.5 py-2.5`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              >
                {EXPENSE_CATS.map((k) => (
                  <option key={k} value={k}>
                    {FIN_EXPENSE_CATEGORIES[k]!.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelCls} text-text-muted`}>Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`${inputCls} bg-surface-alt text-text px-3.5 py-2.5`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              />
            </div>
            <div>
              <label className={`${labelCls} text-text-muted`}>Amount (GH&#x20B5;)</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className={`${inputCls} bg-surface-alt text-text px-3.5 py-2.5`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              />
            </div>
            <div>
              <label className={`${labelCls} text-text-muted`}>Description</label>
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Expense description"
                className={`${inputCls} bg-surface-alt text-text px-3.5 py-2.5`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              />
            </div>
            <div>
              <label className={`${labelCls} text-text-muted`}>Vendor</label>
              <input
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
                placeholder="Vendor name"
                className={`${inputCls} bg-surface-alt text-text px-3.5 py-2.5`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              />
            </div>
            <div>
              <label className={`${labelCls} text-text-muted`}>Reference</label>
              <input
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
                placeholder="REF-001"
                className={`${inputCls} bg-surface-alt text-text px-3.5 py-2.5`}
                style={{
                  border: `1.5px solid ${C.border}`,
                }}
              />
            </div>
            <label className="text-text flex cursor-pointer items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={formRecurring}
                onChange={(e) => setFormRecurring(e.target.checked)}
                style={{ accentColor: C.primary }}
              />
              Recurring expense
            </label>
          </div>

          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="text-text-dim flex-1 rounded-[10px] bg-transparent py-2.5 font-[inherit] text-[13px] font-bold"
              style={{
                border: `1.5px solid ${C.border}`,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveExpense}
              className="bg-primary flex-1 rounded-[10px] border-none py-2.5 font-[inherit] text-[13px] font-bold text-white"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Sub-tab pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={clsx(
                'rounded-[20px] px-4 py-[7px] font-[inherit] text-xs font-bold whitespace-nowrap transition-all duration-150',
                active ? 'bg-primary-bg text-primary' : 'text-text-dim',
              )}
              style={{
                border: `1.5px solid ${active ? C.primary : C.border}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {subTab === 'dashboard' && renderDashboard()}
      {subTab === 'revenue' && renderRevenue()}
      {subTab === 'expenses' && renderExpenses()}
      {subTab === 'cashflow' && renderCashFlow()}
      {subTab === 'projections' && renderProjections()}
      {subTab === 'reports' && renderReports()}

      {renderExpenseModal()}
    </div>
  );
}
