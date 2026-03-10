// ─── Admin-specific TypeScript interfaces ────────────────────
// Derived from wireframe data structures (shopchain-inventory final.jsx)
// and enhanced with strict typing for the admin dashboard.

import type { PlanId, PlanTier, PlanUsage } from './plan.types';
import type { PaymentMethod, PaymentRecord, AdminUser } from './user.types';
import type { Breakpoint } from '../constants/breakpoints';

// ─────────────────────────────────────────────────────────────
// 1. Admin User & Shop types (enhanced from wireframe)
// ─────────────────────────────────────────────────────────────

/** Strict status union for admin-managed users */
export type AdminUserStatus = 'active' | 'deactivated' | 'pending' | 'suspended';

/** Strict status union for admin-managed shops */
export type AdminShopStatus = 'active' | 'suspended';

/**
 * Enhanced admin user record with strict literal types.
 * The base AdminUser (user.types.ts) uses loose strings; this
 * narrows status and plan to their known domains.
 */
export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: AdminUserStatus;
  plan: PlanId;
  shops: number;
  branches: number;
  joined: string;
  lastActive: string;
  avatar: string;
}

/**
 * Enhanced admin shop record with strict literal types.
 * Mirrors AdminShop from shop.types.ts but with narrowed unions.
 */
export interface AdminShopRecord {
  id: string;
  name: string;
  type: string;
  owner: string;
  ownerEmail: string;
  plan: PlanId;
  branches: number;
  team: number;
  status: AdminShopStatus;
  created: string;
  icon: string;
}

// ─────────────────────────────────────────────────────────────
// 2. Plan management
// ─────────────────────────────────────────────────────────────

/** Lifecycle stage for admin-managed plans */
export type PlanLifecycle = 'draft' | 'scheduled' | 'active' | 'retiring' | 'retired';

/**
 * Admin-managed plan that extends the base PlanTier with lifecycle
 * and migration/retirement metadata.
 */
export interface AdminPlan extends PlanTier {
  lifecycle: PlanLifecycle;
  availableFrom: string | null;
  retireAt: string | null;
  migrateAt: string | null;
  fallbackPlanId: PlanId | null;
  grandfathered: boolean;
}

// ─────────────────────────────────────────────────────────────
// 3. Admin roles & team
// ─────────────────────────────────────────────────────────────

/** Known admin role identifiers */
export type AdminRoleId = 'super_admin' | 'admin' | 'billing_manager' | 'support_agent' | 'auditor';

/** Definition of an admin role including its permission set */
export interface AdminRoleDef {
  id?: AdminRoleId;
  label: string;
  color: string;
  icon: string;
  desc: string;
  description?: string;
  permissions: Record<string, boolean>;
}

/** Status options for admin team members */
export type AdminTeamStatus = 'active' | 'invited' | 'suspended';

/** A member of the admin team */
export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRoleId;
  status: AdminTeamStatus;
  twoFA: boolean;
  lastLogin: string | null;
  avatar: string;
  joined?: string;
  createdBy?: string;
  createdAt?: string;
}

/** Form data for inviting a new admin team member */
export interface AdminInviteForm {
  name: string;
  email: string;
  phone: string;
  role: AdminRoleId;
  message: string;
}

// ─────────────────────────────────────────────────────────────
// 4. Announcements
// ─────────────────────────────────────────────────────────────

/** Target audience for an announcement */
export type AnnouncementTarget = 'all' | 'free' | 'basic' | 'max';

/** Priority level for an announcement */
export type AnnouncementPriority = 'info' | 'warning' | 'critical';

/** Publication status of an announcement */
export type AnnouncementStatus = 'active' | 'draft';

/** An announcement created by the admin team */
export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  target: AnnouncementTarget;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  created: string;
}

// ─────────────────────────────────────────────────────────────
// 5. Finance types
// ─────────────────────────────────────────────────────────────

/** Known expense category keys */
export type ExpenseCategory =
  | 'infrastructure'
  | 'paymentFees'
  | 'sms'
  | 'staff'
  | 'marketing'
  | 'software'
  | 'office'
  | 'compliance';

/** Definition / metadata for an expense category */
export interface ExpenseCategoryDef {
  label: string;
  icon: string;
  color: string;
}

/** An attachment on an expense item */
export interface ExpenseAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  addedAt: string;
}

/** A single expense line item */
export interface ExpenseItem {
  id: string;
  date: string;
  category: ExpenseCategory;
  desc: string;
  amount: number;
  vendor: string;
  recurring: boolean;
  ref: string;
  attachments: ExpenseAttachment[];
}

/** Ghana tax rate schedule */
export interface GhTaxRates {
  corporateRate: number;
  startupRebate: number;
  nhil: number;
  getfl: number;
  covidLevy: number;
  vat: number;
}

/** Non-operating cash flow items */
export interface CashFlowOther {
  ownerInvestment: number;
  loanRepayment: number;
  dividends: number;
  equipmentPurchase: number;
  devCosts: number;
}

// ─────────────────────────────────────────────────────────────
// 6. Investor types
// ─────────────────────────────────────────────────────────────

/** Monthly engagement metrics (basic) */
export interface EngagementMonth {
  month: string;
  dau: number;
  wau: number;
  mau: number;
}

/** Extended engagement metrics used in investor data */
export interface InvEngagement {
  month: string;
  dau: number;
  wau: number;
  mau: number;
  visits: number;
  signups: number;
  activated: number;
  paidConv: number;
}

/** Monthly user growth figures (basic) */
export interface GrowthMonth {
  month: string;
  newUsers: number;
  churned: number;
  net: number;
}

/** Extended user growth used in investor data */
export interface InvUserGrowth {
  month: string;
  total: number;
  active: number;
  newUsers: number;
  churned: number;
  free: number;
  basic: number;
  max: number;
}

/** Monthly shop growth figures (basic) */
export interface ShopGrowthMonth {
  month: string;
  newShops: number;
  closed: number;
  net: number;
}

/** Extended shop growth used in investor data */
export interface InvShopGrowth {
  month: string;
  total: number;
  active: number;
  newShops: number;
  retail: number;
  wholesale: number;
  restaurant: number;
  pharmacy: number;
  other: number;
}

/** A single row in the cohort retention table (basic) */
export interface CohortRow {
  cohort: string;
  m0: number;
  m1?: number;
  m2?: number;
  m3?: number;
  m4?: number;
  m5?: number;
}

/** Extended cohort retention with up to 12 months */
export interface InvCohortRetention {
  cohort: string;
  m0: number;
  m1?: number;
  m2?: number;
  m3?: number;
  m4?: number;
  m5?: number;
  m6?: number;
  m7?: number;
  m8?: number;
  m9?: number;
  m10?: number;
  m11?: number;
}

/** A company milestone for the investor timeline */
export interface Milestone {
  id: string;
  date: string;
  title: string;
  desc: string;
  icon: string;
}

/** Alias for milestone used in investor data */
export type InvMilestone = Milestone;

// ─────────────────────────────────────────────────────────────
// 7. Audit & Fraud types
// ─────────────────────────────────────────────────────────────

/** Audit event category */
export type AuditCategory = 'auth' | 'financial' | 'data' | 'admin' | 'system';

/** Definition / metadata for an audit category */
export interface AuditCategoryDef {
  label: string;
  icon: string;
  color: string;
}

/** Risk level classification */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Definition / metadata for a risk level */
export interface RiskLevelDef {
  label: string;
  color: string;
  min: number;
  max: number;
}

/** A single audit log event */
export interface AuditEvent {
  id: string;
  ts: string;
  actor: string;
  actorId: string | null;
  role: string | null;
  cat: AuditCategory;
  action: string;
  target: string;
  ip: string;
  device: string;
  session: string | null;
  location: string;
  risk: number;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  note: string;
}

/** Investigation case status */
export type InvestigationStatus = 'open' | 'in_progress' | 'escalated' | 'closed';

/** A note attached to an investigation case */
export interface InvestigationNote {
  id: string;
  author: string;
  time: string;
  text: string;
}

/** A fraud / compliance investigation case */
export interface Investigation {
  id: string;
  title: string;
  status: InvestigationStatus;
  priority: RiskLevel;
  assignee: string;
  created: string;
  updated: string;
  desc: string;
  linkedEvents: string[];
  linkedUsers: string[];
  impact: string;
  notes: InvestigationNote[];
  findings: string;
  resolution: string | null;
}

/** Status for an anomaly detection alert */
export type AnomalyStatus = 'escalated' | 'reviewing' | 'resolved' | 'dismissed';

/** An anomaly detection alert */
export interface Anomaly {
  id: string;
  rule: string;
  severity: RiskLevel;
  entity: string;
  ts: string;
  summary: string;
  status: AnomalyStatus;
  linkedCase: string | null;
  events: string[];
}

/** A detection rule configuration */
export interface DetectionRule {
  id: string;
  name: string;
  desc: string;
  threshold: string;
  severity: RiskLevel;
  enabled: boolean;
  triggers: number;
}

/** A single login record in forensic timeline */
export interface ForensicLogin {
  ts: string;
  ip: string;
  device: string;
  location: string;
  status: 'success' | 'failed';
}

// ─────────────────────────────────────────────────────────────
// 8. Subscription management
// ─────────────────────────────────────────────────────────────

/** Form data for granting a billing exemption */
export interface ExemptionForm {
  userId: string;
  period: string;
  unit: 'months' | 'years';
  unlimited: boolean;
  reason: string;
}

/** Composite view of a user's subscription, usage, and payments */
export interface UserSubscriptionView {
  user: AdminUser;
  plan: PlanTier;
  usage: PlanUsage;
  paymentMethods: PaymentMethod[];
  paymentHistory: PaymentRecord[];
}

// ─────────────────────────────────────────────────────────────
// 9. Shared admin props
// ─────────────────────────────────────────────────────────────

/** Common props passed to admin tab/page components */
export interface AdminTabProps {
  /** The active admin theme colour map (Record<string, string>) */
  C: Record<string, string>;
  /** Current breakpoint identifier */
  bp: Breakpoint;
  /** Admin-managed user list */
  users: AdminUserRecord[];
  /** Admin-managed shop list */
  shops: AdminShopRecord[];
}
