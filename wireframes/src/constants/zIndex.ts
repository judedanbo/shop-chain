/**
 * Centralized z-index scale for the entire application.
 *
 * Layer order (lowest → highest):
 *   POS float buttons → Mobile nav → Mobile overlay / Sidebar →
 *   Popover → Modal → Modal (stacked) → Dropdown → Toast
 *
 * Use these constants instead of hard-coding z-[N] values so the
 * stacking hierarchy is consistent and easy to reason about.
 */
export const Z = {
  /** POS floating cart button & held-order bar */
  POS_FLOAT: 800,
  POS_FLOAT_BAR: 799,

  /** Bottom mobile navigation bar */
  MOBILE_NAV: 900,

  /** Overlay behind mobile sidebar */
  MOBILE_OVERLAY: 998,
  /** Mobile sidebar panel */
  SIDEBAR: 999,

  /** Click-away backdrop for popovers (ThemePicker, etc.) */
  POPOVER_BACKDROP: 999,
  /** Popover content (ThemePicker dropdown, etc.) */
  POPOVER: 1000,

  /** Standard modal backdrop */
  MODAL_BACKDROP: 1100,
  /** Standard modal content (sits above backdrop) */
  MODAL: 1101,

  /** Scanner modal — intentionally above other modals */
  MODAL_SCANNER_BACKDROP: 1200,
  MODAL_SCANNER: 1201,

  /** Header dropdown click-away overlay */
  DROPDOWN_BACKDROP: 9998,
  /** Header dropdown content (notifications, profile, role switcher) */
  DROPDOWN: 9999,

  /** Toast notifications — always on top */
  TOAST: 10000,
} as const;
