import React from 'react';
import clsx from 'clsx';
import {
  CheckCircle,
  RotateCcw,
  Printer,
  Mail,
  Copy,
  X,
  Search,
  Plus,
  UserPlus,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { QrCodeSvg } from '@/components/QrCode';
import type { ThemeColors } from '@/types/theme.types';
import type { Customer, SaleRecord } from '@/types';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

export type PaymentMethodType = 'cash' | 'card' | 'momo' | null;

export interface POSReceiptProps {
  cart: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  discount: number;
  discountLabel: string;
  total: number;
  change: number;
  receiptNo: string;
  currentVerifyToken: string;
  cashierName: string;
  paymentMethod: PaymentMethodType;
  amountTendered: string;
  cardType: string;
  cardTransNo: string;
  momoProvider: string;
  momoPhone: string;
  momoRef: string;
  // Sale data
  latestSale: SaleRecord | undefined;
  // Customer state
  selectedCust: Customer | null;
  setPosCustomer: (val: string | null) => void;
  showCustPicker: boolean;
  setShowCustPicker: (val: boolean) => void;
  custSearch: string;
  setCustSearch: (val: string) => void;
  showQuickAddCust: boolean;
  setShowQuickAddCust: (val: boolean) => void;
  quickCustForm: { name: string; phone: string };
  setQuickCustForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  handleQuickAddCust: () => void;
  customers: Customer[];
  updateSaleCustomer: (custId: string | null) => void;
  // Shop info
  shopName: string;
  branchName: string | undefined;
  shopCity: string;
  // Actions
  canInitiateReversal: boolean;
  handleReverseSale: (sale: SaleRecord) => void;
  resetAll: () => void;
  toast: { success: (msg: string) => void; info: (msg: string) => void };
  COLORS: ThemeColors;
}

export const POSReceipt: React.FC<POSReceiptProps> = ({
  cart,
  totalItems,
  subtotal,
  tax,
  discount,
  discountLabel,
  total,
  change,
  receiptNo,
  currentVerifyToken,
  cashierName,
  paymentMethod,
  amountTendered,
  cardType,
  cardTransNo,
  momoProvider,
  momoPhone,
  momoRef,
  latestSale,
  selectedCust,
  setPosCustomer,
  showCustPicker,
  setShowCustPicker,
  custSearch,
  setCustSearch,
  showQuickAddCust,
  setShowQuickAddCust,
  quickCustForm,
  setQuickCustForm,
  handleQuickAddCust,
  customers,
  updateSaleCustomer,
  shopName,
  branchName,
  shopCity,
  canInitiateReversal,
  handleReverseSale,
  resetAll,
  toast,
  COLORS,
}) => {
  const momoProviderLabel: Record<string, string> = {
    mtn: 'MTN MoMo',
    tcash: 'TCash',
    atcash: 'ATCash',
    gmoney: 'G-Money',
  };
  const isSplitSale = latestSale?.paymentMethod === 'split';
  const payLabel = isSplitSale
    ? `Split (${latestSale?.splits?.length || 0})`
    : paymentMethod === 'cash'
      ? 'Cash'
      : paymentMethod === 'card'
        ? cardType
        : momoProviderLabel[momoProvider];

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-start gap-4 overflow-y-auto p-5">
      {/* Status Banner -- reversed / pending / success */}
      {latestSale?.status === 'reversed' ? (
        <div className="border-danger/[0.19] bg-danger/[0.06] mb-1 flex items-center gap-3 rounded-[14px] border-[1.5px] px-6 py-3.5">
          <div className="bg-danger/[0.13] flex h-11 w-11 items-center justify-center rounded-full">
            <RotateCcw size={24} className="text-danger" />
          </div>
          <div>
            <div className="text-danger text-base font-extrabold">Sale Reversed</div>
            <div className="text-text-dim text-[11px]">
              {latestSale.reversalReason} — by {latestSale.reversedBy}
            </div>
          </div>
        </div>
      ) : latestSale?.status === 'pending_reversal' ? (
        <div className="border-warning/[0.19] bg-warning/[0.07] mb-1 flex items-center gap-3 rounded-[14px] border-[1.5px] px-6 py-3.5">
          <div className="bg-warning/[0.13] flex h-11 w-11 items-center justify-center rounded-full">
            <Clock size={24} className="text-warning" />
          </div>
          <div>
            <div className="text-warning text-base font-extrabold">Reversal Pending Approval</div>
            <div className="text-text-dim text-[11px]">Awaiting manager approval — {latestSale.reversalReason}</div>
          </div>
        </div>
      ) : (
        <div className="bg-success-bg border-success/[0.19] mb-1 flex items-center gap-3 rounded-[14px] border-[1.5px] px-6 py-3.5">
          <div className="bg-success/[0.13] flex h-11 w-11 items-center justify-center rounded-full">
            <CheckCircle size={24} className="text-success" />
          </div>
          <div>
            <div className="text-success text-base font-extrabold">Payment Successful</div>
            <div className="text-text-dim text-[11px]">
              {isSplitSale ? (
                <>
                  {'\u2702'} Split Payment · GH₵ {total.toFixed(2)}
                </>
              ) : (
                <>
                  {paymentMethod === 'cash' ? '\u{1F4B5}' : paymentMethod === 'card' ? '\u{1F4B3}' : '\u{1F4F1}'}{' '}
                  {payLabel} · GH₵ {total.toFixed(2)}
                  {paymentMethod === 'cash' && change > 0 && ` · Change: GH₵ ${change.toFixed(2)}`}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Assignment Card -- prominent outside receipt */}
      <div className="w-full max-w-[340px]">
        {selectedCust ? (
          <div className="bg-surface border-primary/[0.19] flex items-center gap-2.5 rounded-xl border-[1.5px] px-4 py-3">
            <div className="text-primary bg-primary/[0.08] flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-[15px] font-extrabold">
              {selectedCust.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-text text-[13px] font-bold">{selectedCust.name}</div>
              <div className="text-text-dim text-[10px]">
                {selectedCust.phone} · {selectedCust.type} · \u2B50 {selectedCust.loyaltyPts || 0} pts
              </div>
            </div>
            <div className="flex gap-1">
              <div
                onClick={() => {
                  setShowCustPicker(true);
                  setCustSearch('');
                  setShowQuickAddCust(false);
                }}
                className="border-border text-text-muted cursor-pointer rounded-[7px] border bg-transparent px-2.5 py-[5px] text-[10px] font-semibold"
              >
                Change
              </div>
              <div
                onClick={() => {
                  updateSaleCustomer(null);
                  setPosCustomer(null);
                }}
                className="border-border flex cursor-pointer items-center rounded-[7px] border bg-transparent px-2 py-[5px]"
              >
                <X size={12} className="text-text-dim" />
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              setShowCustPicker(true);
              setCustSearch('');
              setShowQuickAddCust(false);
            }}
            className="bg-surface hover:border-primary hover:bg-primary-bg flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3.5 transition-all duration-150"
            style={{ border: `1.5px dashed ${COLORS.primary}40` }}
          >
            <div className="bg-primary-bg flex h-[38px] w-[38px] items-center justify-center rounded-[10px]">
              <UserPlus size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-primary text-[13px] font-bold">+ Assign Customer</div>
              <div className="text-text-dim text-[10px]">Link this sale to a customer record or create new</div>
            </div>
            <ChevronRight size={16} className="text-primary" />
          </div>
        )}
      </div>

      {/* Thermal Receipt Preview */}
      <div
        className="relative w-full max-w-[340px] overflow-hidden rounded-[4px] bg-white font-mono text-black"
        style={{
          boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
        }}
      >
        {/* REVERSED stamp overlay */}
        {latestSale?.status === 'reversed' && (
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 z-10 rounded-lg border-[3px] border-[#EF444460] px-4 py-1 text-[32px] font-black tracking-[4px] whitespace-nowrap text-[#EF444460]"
            style={{
              transform: 'translate(-50%, -50%) rotate(-30deg)',
            }}
          >
            REVERSED
          </div>
        )}
        {/* Torn top edge */}
        <div
          className="relative top-0 h-2.5"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent 0, transparent 6px, #fff 6px, #fff 7px, transparent 7px, transparent 13px)',
            backgroundSize: '13px 10px',
          }}
        />

        <div className="px-5 pt-3 pb-5">
          {/* Shop Header */}
          <div className="pb-3 text-center" style={{ borderBottom: '1px dashed #999' }}>
            <div className="text-lg font-black tracking-[2px]">{shopName.toUpperCase()}</div>
            <div className="mt-0.5 text-[9px] text-[#666]">
              {branchName ? `${branchName} · ` : ''}
              {shopCity}
            </div>
            <div className="text-[9px] text-[#666]">Tel: +233 30 277 8899</div>
          </div>

          {/* Transaction Info */}
          <div className="py-2.5 text-[10px] text-[#333]" style={{ borderBottom: '1px dashed #999' }}>
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span className="font-bold">{receiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>
                {new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cashier:</span>
              <span>{cashierName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Customer:</span>
              {selectedCust ? (
                <span className="flex items-center gap-1 font-bold">
                  {selectedCust.name}
                  <span
                    onClick={() => {
                      updateSaleCustomer(null);
                      setPosCustomer(null);
                    }}
                    className="ml-0.5 cursor-pointer text-[9px] text-[#999]"
                  >
                    \u2715
                  </span>
                </span>
              ) : (
                <span
                  onClick={() => {
                    setShowCustPicker(true);
                    setCustSearch('');
                  }}
                  className="flex cursor-pointer items-center gap-[3px] font-semibold text-[#2563EB]"
                >
                  + Assign Customer
                </span>
              )}
            </div>
            {selectedCust && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{selectedCust.phone}</span>
              </div>
            )}
          </div>

          {/* Item Headers */}
          <div className="flex justify-between border-b border-[#ddd] pt-2 pb-1 text-[9px] font-bold text-[#666] uppercase">
            <span className="flex-[2]">Item</span>
            <span className="w-[30px] text-center">Qty</span>
            <span className="w-[55px] text-right">Price</span>
            <span className="w-[65px] text-right">Amount</span>
          </div>

          {/* Line Items */}
          {cart.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-start py-[5px] text-[10px]"
              style={{
                borderBottom: idx < cart.length - 1 ? '1px dotted #eee' : 'none',
              }}
            >
              <span className="flex-[2] overflow-hidden pr-1 text-ellipsis whitespace-nowrap">{item.name}</span>
              <span className="w-[30px] text-center">{item.qty}</span>
              <span className="w-[55px] text-right">{item.price.toFixed(2)}</span>
              <span className="w-[65px] text-right font-semibold">{(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}

          {/* Totals */}
          <div className="mt-2 pt-2" style={{ borderTop: '1px dashed #999' }}>
            <div className="flex justify-between py-[2px] text-[10px] text-[#555]">
              <span>Subtotal ({totalItems} items)</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-[2px] text-[10px] text-[#555]">
              <span>NHIL/VAT (12.5%)</span>
              <span>{tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-[2px] text-[10px] text-[#16a34a]">
                <span>{discountLabel}</span>
                <span>-{discount.toFixed(2)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t-2 border-black pt-1.5 pb-0.5 text-sm font-black">
              <span>TOTAL (GH₵)</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="mt-1.5 pt-1.5" style={{ borderTop: '1px dashed #999' }}>
            <div className="flex justify-between text-[10px] text-[#555]">
              <span>Payment:</span>
              <span className="font-semibold">{payLabel}</span>
            </div>
            {isSplitSale && latestSale?.splits ? (
              latestSale.splits.map((sp, si) => (
                <div
                  key={si}
                  className="py-[3px]"
                  style={{
                    borderBottom: si < (latestSale.splits?.length || 0) - 1 ? '1px dotted #ddd' : 'none',
                  }}
                >
                  <div className="flex justify-between text-[10px] text-[#333]">
                    <span className="font-semibold">{sp.label}</span>
                    <span className="font-semibold">GH₵ {sp.amount.toFixed(2)}</span>
                  </div>
                  {sp.detail && <div className="text-[9px] text-[#888]">{sp.detail}</div>}
                </div>
              ))
            ) : (
              <>
                {paymentMethod === 'cash' && amountTendered && (
                  <>
                    <div className="flex justify-between text-[10px] text-[#555]">
                      <span>Tendered:</span>
                      <span>GH₵ {parseFloat(amountTendered).toFixed(2)}</span>
                    </div>
                    {change > 0 && (
                      <div className="flex justify-between text-[11px] font-bold text-[#16a34a]">
                        <span>Change:</span>
                        <span>GH₵ {change.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
                {paymentMethod === 'card' && (
                  <div className="flex justify-between text-[10px] text-[#555]">
                    <span>Trans No.:</span>
                    <span>{cardTransNo}</span>
                  </div>
                )}
                {paymentMethod === 'momo' && (
                  <>
                    <div className="flex justify-between text-[10px] text-[#555]">
                      <span>Phone:</span>
                      <span>{momoPhone}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#555]">
                      <span>Ref:</span>
                      <span>{momoRef}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Loyalty */}
          {selectedCust && (
            <div className="mt-1.5 pt-1.5 text-center" style={{ borderTop: '1px dashed #999' }}>
              <div className="text-[9px] text-[#666]">
                Loyalty Points Earned: <span className="font-bold">+{Math.floor(total / 10)}</span>
              </div>
              <div className="text-[9px] text-[#666]">
                Balance: {(selectedCust.loyaltyPts || 0) + Math.floor(total / 10)} pts
              </div>
            </div>
          )}

          {/* QR Code -- links to verification page */}
          <div className="mt-3 pt-2.5 text-center" style={{ borderTop: '1px dashed #999' }}>
            <div className="mx-auto h-20 w-20">
              <QrCodeSvg data={`${window.location.origin}/#/verify/${currentVerifyToken}`} size={80} />
            </div>
            <div className="mt-1 text-[8px] text-[#999]">Scan to verify · {receiptNo}</div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 text-center" style={{ borderTop: '1px dashed #999' }}>
            <div className="text-[10px] font-bold text-[#333]">Thank you for shopping with us!</div>
            <div className="mt-0.5 text-[8px] text-[#999]">Goods sold are not returnable · shopchain.io</div>
            <div className="mt-1 text-[8px] text-[#bbb]">Powered by ShopChain\u2122</div>
          </div>
        </div>

        {/* Torn bottom edge */}
        <div
          className="h-2.5"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent 0, transparent 6px, #fff 6px, #fff 7px, transparent 7px, transparent 13px)',
            backgroundSize: '13px 10px',
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="secondary" icon={Printer} onClick={() => toast.success('Receipt sent to printer')}>
          Print
        </Button>
        <Button variant="ghost" icon={Mail} onClick={() => toast.success('Receipt emailed to customer')}>
          Email
        </Button>
        <Button
          variant="ghost"
          icon={Copy}
          onClick={() => {
            navigator.clipboard?.writeText(receiptNo);
            toast.info('Receipt link copied');
          }}
        >
          Share
        </Button>
        {canInitiateReversal && latestSale && latestSale.status === 'completed' && (
          <Button variant="danger" icon={RotateCcw} onClick={() => handleReverseSale(latestSale)}>
            Reverse Sale
          </Button>
        )}
        <Button variant="primary" icon={RotateCcw} onClick={resetAll}>
          New Sale
        </Button>
      </div>

      {/* Customer Picker on Receipt */}
      {showCustPicker && (
        <div className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-surface border-border flex max-h-[70vh] w-full max-w-[380px] flex-col overflow-hidden rounded-[14px] border"
            style={{
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              animation: 'modalIn 0.2s ease',
            }}
          >
            <div className="border-border flex items-center justify-between border-b px-[18px] py-3.5">
              <span className="text-text text-sm font-extrabold">Assign Customer to Sale</span>
              <button
                type="button"
                onClick={() => setShowCustPicker(false)}
                aria-label="Close"
                className="text-text-dim"
              >
                <X size={18} />
              </button>
            </div>
            <div className="border-border border-b px-[18px] py-2.5">
              <div className="relative">
                <Search size={13} className="text-text-dim absolute top-1/2 left-2.5 -translate-y-1/2" />
                <input
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                  placeholder="Search by name or phone\u2026"
                  autoFocus
                  className="border-border bg-surface-alt text-text box-border w-full rounded-[10px] border py-[9px] pr-3 pl-8 font-[inherit] text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {customers
                .filter((c) => {
                  if (!custSearch) return true;
                  const s = custSearch.toLowerCase();
                  return c.name.toLowerCase().includes(s) || c.phone.includes(s);
                })
                .slice(0, 10)
                .map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setPosCustomer(c.id);
                      updateSaleCustomer(c.id);
                      setShowCustPicker(false);
                    }}
                    className="border-border/[0.03] hover:bg-primary/[0.03] flex cursor-pointer items-center gap-2.5 border-b px-[18px] py-[11px] transition-colors"
                  >
                    <div className="text-primary bg-primary/[0.08] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] text-[13px] font-extrabold">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-text text-[13px] font-semibold">{c.name}</div>
                      <div className="text-text-dim text-[10px]">
                        {c.phone} · {c.type}
                      </div>
                    </div>
                    {c.loyaltyPts > 100 && (
                      <span className="text-warning text-[9px] font-bold">\u2B50 {c.loyaltyPts}</span>
                    )}
                  </div>
                ))}
              {customers.filter((c) => {
                if (!custSearch) return true;
                const s = custSearch.toLowerCase();
                return c.name.toLowerCase().includes(s) || c.phone.includes(s);
              }).length === 0 &&
                custSearch && <div className="text-text-dim p-5 text-center text-[11px]">No customers found</div>}
            </div>
            <div className="border-border bg-surface-alt border-t px-[18px] py-3">
              {!showQuickAddCust ? (
                <div
                  onClick={() => setShowQuickAddCust(true)}
                  className="text-primary flex cursor-pointer items-center gap-1.5 text-xs font-semibold"
                >
                  <Plus size={14} /> Create New Customer
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="text-text text-[11px] font-bold">Quick Add Customer</div>
                  <input
                    value={quickCustForm.name}
                    onChange={(e) =>
                      setQuickCustForm((p) => ({
                        ...p,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Customer name *"
                    className="border-border text-text bg-surface box-border rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
                  />
                  <input
                    value={quickCustForm.phone}
                    onChange={(e) =>
                      setQuickCustForm((p) => ({
                        ...p,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="Phone number *"
                    className="border-border text-text bg-surface box-border rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
                  />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddCust(false);
                        setQuickCustForm({ name: '', phone: '' });
                      }}
                      className="border-border text-text-muted flex-1 rounded-lg border bg-transparent px-2.5 py-[7px] font-[inherit] text-[11px] font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCust}
                      disabled={!quickCustForm.name.trim() || !quickCustForm.phone.trim()}
                      className={clsx(
                        'flex-1 rounded-lg border-none px-2.5 py-[7px] font-[inherit] text-[11px] font-bold',
                        quickCustForm.name.trim() && quickCustForm.phone.trim()
                          ? 'cursor-pointer text-white'
                          : 'text-text-dim cursor-not-allowed',
                      )}
                      style={{
                        background:
                          quickCustForm.name.trim() && quickCustForm.phone.trim() ? COLORS.primary : COLORS.surfaceAlt,
                      }}
                    >
                      Add & Select
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
