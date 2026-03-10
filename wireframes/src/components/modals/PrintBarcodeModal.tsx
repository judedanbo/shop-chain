import React, { useState } from 'react';
import { X, Printer, QrCode, Copy } from 'lucide-react';
import { useColors } from '@/context';
import { isMobile } from '@/utils/responsive';
import type { Breakpoint } from '@/constants/breakpoints';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarcodeStripes } from './BarcodeStripes';
import type { Product } from '@/types';

type LabelFormat = 'full' | 'with_price' | 'barcode_only' | 'inline';
type LabelSize = 'small' | 'medium' | 'large';

interface PrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  bp: Breakpoint;
}

const LABEL_FORMATS: Array<{ value: LabelFormat; label: string; description: string }> = [
  { value: 'full', label: 'Full Label', description: 'Product name, SKU, barcode & price' },
  { value: 'with_price', label: 'With Price', description: 'Barcode with price below' },
  { value: 'barcode_only', label: 'Barcode Only', description: 'Just the barcode and number' },
  { value: 'inline', label: 'Inline', description: 'Horizontal barcode with info' },
];

const LABEL_SIZES: Array<{ value: LabelSize; label: string; width: number; height: number }> = [
  { value: 'small', label: 'Small (38x25mm)', width: 120, height: 80 },
  { value: 'medium', label: 'Medium (50x30mm)', width: 160, height: 96 },
  { value: 'large', label: 'Large (70x40mm)', width: 224, height: 128 },
];

export const PrintBarcodeModal: React.FC<PrintBarcodeModalProps> = ({ isOpen, onClose, product, bp }) => {
  const COLORS = useColors();
  const mobile = isMobile(bp);

  const [format, setFormat] = useState<LabelFormat>('full');
  const [size, setSize] = useState<LabelSize>('medium');
  const [copies, setCopies] = useState(1);

  if (!isOpen || !product) return null;

  const sizeConfig = LABEL_SIZES.find((s) => s.value === size) || LABEL_SIZES[1]!;
  const previewScale = mobile ? 1.3 : 1.5;
  const barcode = product.barcode || product.id;

  const renderLabelPreview = () => {
    const w = sizeConfig.width * previewScale;
    const h = sizeConfig.height * previewScale;

    if (format === 'barcode_only') {
      return (
        <div
          className="flex flex-col items-center justify-center overflow-hidden rounded p-1.5"
          style={{
            width: w,
            height: h,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            fontFamily: "'Inter', sans-serif",
            color: '#111',
          }}
        >
          <div style={{ color: '#111' }}>
            <BarcodeStripes code={barcode} width={w * 0.8} height={h * 0.5} />
          </div>
          <div
            className="mt-0.5 tracking-[2px]"
            style={{
              fontSize: size === 'small' ? 7 : size === 'medium' ? 8 : 10,
              fontFamily: 'monospace',
              color: '#374151',
            }}
          >
            {barcode}
          </div>
        </div>
      );
    }

    if (format === 'with_price') {
      return (
        <div
          className="flex flex-col items-center justify-center overflow-hidden rounded p-1.5"
          style={{
            width: w,
            height: h,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            fontFamily: "'Inter', sans-serif",
            color: '#111',
          }}
        >
          <div style={{ color: '#111' }}>
            <BarcodeStripes code={barcode} width={w * 0.75} height={h * 0.35} />
          </div>
          <div
            className="mt-px tracking-[1.5px]"
            style={{
              fontSize: size === 'small' ? 6 : 7,
              fontFamily: 'monospace',
              color: '#6b7280',
            }}
          >
            {barcode}
          </div>
          <div
            className="mt-[3px] font-black"
            style={{
              fontSize: size === 'small' ? 14 : size === 'medium' ? 18 : 22,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            <span className="align-top" style={{ fontSize: size === 'small' ? 7 : 9 }}>
              GH&#x20B5;
            </span>
            {product.price.toFixed(2)}
          </div>
        </div>
      );
    }

    if (format === 'inline') {
      return (
        <div
          className="flex items-center justify-between overflow-hidden rounded px-2 py-1"
          style={{
            width: w * 1.3,
            height: h * 0.6,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            fontFamily: "'Inter', sans-serif",
            color: '#111',
          }}
        >
          <div className="mr-2 min-w-0 flex-1">
            <div
              className="overflow-hidden font-bold text-ellipsis whitespace-nowrap"
              style={{
                fontSize: size === 'small' ? 7 : 8,
              }}
            >
              {product.name}
            </div>
            <div style={{ fontSize: size === 'small' ? 5 : 6, color: '#9ca3af', fontFamily: 'monospace' }}>
              {product.id}
            </div>
            <div className="mt-px font-black" style={{ fontSize: size === 'small' ? 10 : 12, fontFamily: 'monospace' }}>
              <span className="align-top text-[6px]">GH&#x20B5;</span>
              {product.price.toFixed(2)}
            </div>
          </div>
          <div className="shrink-0" style={{ color: '#111' }}>
            <BarcodeStripes code={barcode} width={size === 'small' ? 50 : 65} height={size === 'small' ? 25 : 30} />
            <div
              className="text-center text-[5px] tracking-[1px]"
              style={{ fontFamily: 'monospace', color: '#9ca3af' }}
            >
              {barcode}
            </div>
          </div>
        </div>
      );
    }

    // Full label
    return (
      <div
        className="flex flex-col justify-between overflow-hidden rounded"
        style={{
          width: w,
          height: h,
          background: '#fff',
          border: '1.5px solid #e5e7eb',
          fontFamily: "'Inter', sans-serif",
          color: '#111',
          padding: size === 'small' ? 5 : 8,
        }}
      >
        <div>
          <div
            className="overflow-hidden font-bold text-ellipsis whitespace-nowrap"
            style={{
              fontSize: size === 'small' ? 7 : size === 'medium' ? 9 : 11,
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </div>
          <div
            className="mt-px"
            style={{ fontSize: size === 'small' ? 5 : 6, color: '#9ca3af', fontFamily: 'monospace' }}
          >
            {product.id}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="font-semibold" style={{ fontSize: size === 'small' ? 5 : 6, color: '#9ca3af' }}>
              PRICE
            </div>
            <div
              className="font-black"
              style={{
                fontSize: size === 'small' ? 14 : size === 'medium' ? 18 : 24,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              <span className="align-top" style={{ fontSize: size === 'small' ? 7 : 9 }}>
                GH&#x20B5;
              </span>
              {product.price.toFixed(2)}
            </div>
          </div>
          <div className="text-right" style={{ color: '#111' }}>
            <BarcodeStripes
              code={barcode}
              width={size === 'small' ? 50 : size === 'medium' ? 65 : 85}
              height={size === 'small' ? 18 : 24}
            />
            <div className="text-[5px] tracking-[1px]" style={{ fontFamily: 'monospace', color: '#9ca3af' }}>
              {barcode}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
      />
      <div
        className="bg-surface z-modal fixed flex max-h-[96vh] w-[96%] flex-col overflow-hidden rounded-[12px] sm:max-h-[90vh] sm:w-[92%] sm:rounded-2xl md:w-[540px]"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="border-b-border flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
            >
              <QrCode size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <div className="text-text text-[15px] font-bold">Print Barcode Label</div>
              <div className="text-text-dim text-[11px]">
                {product.name} · {barcode}
              </div>
            </div>
          </div>
          <div
            onClick={onClose}
            className="bg-surface-alt flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
          >
            <X size={16} className="text-text-muted" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Live Preview */}
          <div className="mb-4">
            <label className="form-label mb-2 block">Preview</label>
            <div className="bg-surface-alt border-border flex min-h-[100px] items-center justify-center rounded-xl border p-6">
              {renderLabelPreview()}
            </div>
          </div>

          {/* Label Format */}
          <div className="mb-3.5">
            <label className="form-label mb-1.5 block">Label Format</label>
            <div className="grid grid-cols-2 gap-1.5">
              {LABEL_FORMATS.map((f) => (
                <div
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className="cursor-pointer rounded-[10px] px-3 py-2.5 transition-all"
                  style={{
                    background: format === f.value ? `${COLORS.primary}12` : COLORS.surfaceAlt,
                    border: `1.5px solid ${format === f.value ? COLORS.primary : COLORS.border}`,
                  }}
                >
                  <div
                    className="mb-0.5 text-xs font-semibold"
                    style={{ color: format === f.value ? COLORS.primary : COLORS.text }}
                  >
                    {f.label}
                  </div>
                  <div className="text-text-dim text-[10px] leading-[1.3]">{f.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Label Size */}
          <div className="mb-3.5">
            <label className="form-label mb-1.5 block">Label Size</label>
            <div className="flex gap-1.5">
              {LABEL_SIZES.map((s) => (
                <div
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className="flex-1 cursor-pointer rounded-lg px-2.5 py-2 text-center transition-all"
                  style={{
                    background: size === s.value ? `${COLORS.primary}12` : COLORS.surfaceAlt,
                    border: `1px solid ${size === s.value ? COLORS.primary : COLORS.border}`,
                  }}
                >
                  <div
                    className="text-[11px] font-semibold"
                    style={{ color: size === s.value ? COLORS.primary : COLORS.text }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copies */}
          <div>
            <label className="form-label mb-1.5 block">Number of Copies</label>
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="bg-surface-alt border-border text-text flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-base font-bold"
              >
                -
              </div>
              <span className="text-text min-w-[30px] text-center font-mono text-lg font-extrabold">{copies}</span>
              <div
                onClick={() => setCopies(Math.min(200, copies + 1))}
                className="bg-surface-alt border-border text-text flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-base font-bold"
              >
                +
              </div>
              <div className="ml-2 flex gap-1">
                {[1, 10, 25, 50, 100].map((n) => (
                  <div
                    key={n}
                    onClick={() => setCopies(n)}
                    className="cursor-pointer rounded-[6px] px-2 py-1 text-[10px] font-semibold"
                    style={{
                      background: copies === n ? `${COLORS.primary}15` : COLORS.surfaceAlt,
                      color: copies === n ? COLORS.primary : COLORS.textDim,
                      border: `1px solid ${copies === n ? COLORS.primary + '40' : COLORS.border}`,
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-border flex items-center justify-between border-t px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <Badge color="neutral">
              {copies} {copies === 1 ? 'copy' : 'copies'}
            </Badge>
            <Badge color="neutral">{LABEL_SIZES.find((s) => s.value === size)?.label}</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Copy}
              onClick={() => {
                navigator.clipboard.writeText(barcode);
              }}
            >
              Copy Code
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={() => {
                window.print();
              }}
            >
              Print
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
