import React from 'react';
import { Receipt, Eye, Printer, Mail, MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Till, KitchenOrder, KitchenOrderItem } from '@/types';

interface TillReceiptPreviewProps {
  till: Till;
  tillOrders: KitchenOrder[];
  receiptAction: 'preview' | 'print' | 'email' | 'sms' | null;
  receiptEmail: string;
  receiptPhone: string;
  activeShopName: string | undefined;
  activeBranchName: string | undefined;
  activeShopCity: string | undefined;
  onSetReceiptAction: (action: 'preview' | 'print' | 'email' | 'sms' | null) => void;
  onSetReceiptEmail: (value: string) => void;
  onSetReceiptPhone: (value: string) => void;
  onReceiptPrint: () => void;
  onReceiptEmail: () => void;
  onReceiptSms: () => void;
  onClose: () => void;
}

const ReceiptContent: React.FC<{
  till: Till;
  tillOrders: KitchenOrder[];
  activeShopName: string | undefined;
  activeBranchName: string | undefined;
  activeShopCity: string | undefined;
}> = ({ till, tillOrders, activeShopName, activeBranchName, activeShopCity }) => {
  const methodGroups = till.payments.reduce<Record<string, { count: number; total: number }>>((acc, p) => {
    const key =
      p.method === 'cash'
        ? 'Cash'
        : p.method === 'card'
          ? `Card (${p.cardType ?? 'N/A'})`
          : `MoMo (${p.momoProvider ?? 'N/A'})`;
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key]!.count++;
    acc[key]!.total += p.amount;
    return acc;
  }, {});

  return (
    <div
      className="relative w-full max-w-[340px] overflow-hidden rounded bg-white p-0 text-black"
      style={{
        boxShadow: '0 2px 20px rgba(0,0,0,0.12)',
        fontFamily: "'Courier New', monospace",
      }}
    >
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
        <div className="border-b border-dashed border-[#999] pb-3 text-center">
          <div className="text-lg font-black tracking-[2px]">{(activeShopName ?? 'SHOPCHAIN').toUpperCase()}</div>
          <div className="mt-0.5 text-[9px] text-[#666]">
            {activeBranchName ? `${activeBranchName} · ` : ''}
            {activeShopCity ?? 'Accra'}
          </div>
          <div className="text-[9px] text-[#666]">Tel: +233 30 277 8899</div>
        </div>

        {/* Till Close Heading */}
        <div className="border-b border-dashed border-[#999] py-2.5 text-center">
          <div className="text-sm font-black tracking-[1px]">TILL CLOSE SUMMARY</div>
        </div>

        {/* Till Info */}
        <div className="border-b border-dashed border-[#999] py-2.5 text-[10px] text-[#333]">
          <div className="flex justify-between">
            <span>Till:</span>
            <span className="font-bold">{till.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Operator:</span>
            <span>{till.openedBy}</span>
          </div>
          <div className="flex justify-between">
            <span>Opened:</span>
            <span>{new Date(till.openedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Closed:</span>
            <span>{till.closedAt ? new Date(till.closedAt).toLocaleString() : new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-b border-dashed border-[#999] py-2.5 text-[10px]">
          <div className="mb-1.5 text-[9px] font-bold text-[#666] uppercase">Order Summary</div>
          <div className="flex justify-between">
            <span>Total Orders</span>
            <span className="font-bold">{till.orderCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Served</span>
            <span>{tillOrders.filter((o) => o.status === 'served').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Returned</span>
            <span>{tillOrders.filter((o) => o.status === 'returned').length}</span>
          </div>
          <div className="flex justify-between">
            <span>Rejected</span>
            <span>{tillOrders.filter((o) => o.status === 'rejected').length}</span>
          </div>
        </div>

        {/* Order Details */}
        {tillOrders.length > 0 && (
          <div className="border-b border-dashed border-[#999] py-2.5">
            <div className="mb-1.5 text-[9px] font-bold text-[#666] uppercase">Order Details</div>
            {tillOrders.map((order, oi) => (
              <div key={order.id} className={oi < tillOrders.length - 1 ? 'mb-2' : ''}>
                {/* Order header */}
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold">#{order.id.slice(-4)}</span>
                  <span className="flex items-center gap-1">
                    <span className="text-[8px] text-[#666]">
                      {order.orderType === 'dine_in' ? 'Dine-in' : 'Takeaway'}
                    </span>
                    <span
                      className="rounded-[2px] px-1 py-px text-[7px] font-bold"
                      style={{
                        background:
                          order.status === 'served'
                            ? '#dcfce7'
                            : order.status === 'returned'
                              ? '#fee2e2'
                              : order.status === 'rejected'
                                ? '#fee2e2'
                                : '#fef9c3',
                        color:
                          order.status === 'served'
                            ? '#166534'
                            : order.status === 'returned'
                              ? '#991b1b'
                              : order.status === 'rejected'
                                ? '#991b1b'
                                : '#854d0e',
                      }}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </span>
                </div>
                {/* Column headers */}
                <div className="flex justify-between border-b border-[#ddd] py-0.5 text-[8px] font-bold text-[#999]">
                  <span className="flex-[2]">Item</span>
                  <span className="w-[30px] text-center">Qty</span>
                </div>
                {/* Line items */}
                {order.items.map((item: KitchenOrderItem, ii: number) => (
                  <div
                    key={ii}
                    className="flex items-start py-[3px] text-[10px]"
                    style={{
                      borderBottom: ii < order.items.length - 1 ? '1px dotted #eee' : 'none',
                    }}
                  >
                    <span className="flex-[2] truncate pr-1">{item.name}</span>
                    <span className="w-[30px] text-center">{item.qty}</span>
                  </div>
                ))}
                {/* Order total */}
                <div className="flex justify-between pt-1 text-[10px] font-bold">
                  <span>Order Total</span>
                  <span>GH₵ {order.total?.toFixed(2) ?? '—'}</span>
                </div>
                {/* Separator between orders */}
                {oi < tillOrders.length - 1 && <div className="mt-1.5 border-b border-dotted border-[#ccc]" />}
              </div>
            ))}
          </div>
        )}

        {/* Payment Summary */}
        <div className="border-b border-dashed border-[#999] py-2.5 text-[10px]">
          <div className="mb-1.5 text-[9px] font-bold text-[#666] uppercase">Payment Summary</div>
          <div className="mb-0.5 flex justify-between">
            <span>Total Payments</span>
            <span className="font-bold">{till.totalPayments}</span>
          </div>
          {Object.entries(methodGroups).map(([key, val]) => (
            <div key={key} className="flex justify-between py-px">
              <span>
                {key} ({val.count})
              </span>
              <span>GH₵ {val.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className="mt-2 border-t-2 border-black pt-2">
          <div className="flex justify-between text-sm font-black">
            <span>TOTAL (GH₵)</span>
            <span>{till.totalPaymentAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 border-t border-dashed border-[#999] pt-2 text-center">
          <div className="mt-1 text-[8px] text-[#bbb]">Powered by ShopChain™</div>
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
  );
};

export const TillReceiptPreview: React.FC<TillReceiptPreviewProps> = ({
  till,
  tillOrders,
  receiptAction,
  receiptEmail,
  receiptPhone,
  activeShopName,
  activeBranchName,
  activeShopCity,
  onSetReceiptAction,
  onSetReceiptEmail,
  onSetReceiptPhone,
  onReceiptPrint,
  onReceiptEmail,
  onReceiptSms,
  onClose,
}) => (
  <div
    aria-hidden="true"
    className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-5"
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-surface border-border max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-2xl border p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={20} className="text-primary" />
          <span className="text-text text-lg font-bold">Till Receipt</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-text-muted border-none bg-transparent p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Receipt action buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={receiptAction === 'preview' ? 'primary' : 'secondary'}
          size="sm"
          icon={Eye}
          onClick={() => onSetReceiptAction('preview')}
        >
          Preview
        </Button>
        <Button
          variant={receiptAction === 'print' ? 'primary' : 'secondary'}
          size="sm"
          icon={Printer}
          onClick={onReceiptPrint}
        >
          Print
        </Button>
        <Button
          variant={receiptAction === 'email' ? 'primary' : 'secondary'}
          size="sm"
          icon={Mail}
          onClick={() => onSetReceiptAction('email')}
        >
          Email
        </Button>
        <Button
          variant={receiptAction === 'sms' ? 'primary' : 'secondary'}
          size="sm"
          icon={MessageSquare}
          onClick={() => onSetReceiptAction('sms')}
        >
          SMS
        </Button>
      </div>

      {/* Email input */}
      {receiptAction === 'email' && (
        <div className="mb-4">
          <label className="text-text-muted mb-1 block text-[11px] font-semibold">Email Address</label>
          <div className="flex gap-2">
            <input
              value={receiptEmail}
              onChange={(e) => onSetReceiptEmail(e.target.value)}
              placeholder="e.g. manager@shopchain.com"
              className="bg-surface-alt text-text border-border box-border flex-1 rounded-lg border-[1.5px] px-3 py-[9px] font-[inherit] text-[13px] outline-none"
            />
            <Button variant="primary" size="sm" icon={Send} onClick={onReceiptEmail} disabled={!receiptEmail.trim()}>
              Send
            </Button>
          </div>
        </div>
      )}

      {/* SMS input */}
      {receiptAction === 'sms' && (
        <div className="mb-4">
          <label className="text-text-muted mb-1 block text-[11px] font-semibold">Phone Number</label>
          <div className="flex gap-2">
            <input
              value={receiptPhone}
              onChange={(e) => onSetReceiptPhone(e.target.value)}
              placeholder="e.g. 024 XXX XXXX"
              className="bg-surface-alt text-text border-border box-border flex-1 rounded-lg border-[1.5px] px-3 py-[9px] font-[inherit] text-[13px] outline-none"
            />
            <Button variant="primary" size="sm" icon={Send} onClick={onReceiptSms} disabled={!receiptPhone.trim()}>
              Send
            </Button>
          </div>
        </div>
      )}

      {/* Receipt content */}
      <div className="bg-surface-alt border-border rounded-xl border p-5">
        <ReceiptContent
          till={till}
          tillOrders={tillOrders}
          activeShopName={activeShopName}
          activeBranchName={activeBranchName}
          activeShopCity={activeShopCity}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  </div>
);
