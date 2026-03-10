import React, { useState } from 'react';
import { X, Printer, Tag, Maximize2, Minimize2, CreditCard } from 'lucide-react';
import { useColors } from '@/context';
import { isMobile } from '@/utils/responsive';
import type { Breakpoint } from '@/constants/breakpoints';
import { Button } from '@/components/ui/Button';
import { BarcodeStripes } from './BarcodeStripes';
import type { Product } from '@/types';

type TagSize = 'small' | 'medium' | 'large';
type TagStyle = 'shelf' | 'hanging' | 'premium';

interface PrintPriceTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  bp: Breakpoint;
}

const TAG_SIZES: Array<{ value: TagSize; label: string; width: number; height: number }> = [
  { value: 'small', label: 'Small (50x30mm)', width: 160, height: 96 },
  { value: 'medium', label: 'Medium (70x40mm)', width: 224, height: 128 },
  { value: 'large', label: 'Large (90x55mm)', width: 288, height: 176 },
];

const TAG_STYLES: Array<{ value: TagStyle; label: string }> = [
  { value: 'shelf', label: 'Shelf Label' },
  { value: 'hanging', label: 'Hanging Tag' },
  { value: 'premium', label: 'Premium Card' },
];

export const PrintPriceTagModal: React.FC<PrintPriceTagModalProps> = ({ isOpen, onClose, product, bp }) => {
  const COLORS = useColors();
  const mobile = isMobile(bp);

  const [tagSize, setTagSize] = useState<TagSize>('medium');
  const [tagStyle, setTagStyle] = useState<TagStyle>('shelf');
  const [copies, setCopies] = useState(1);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showCategory, setShowCategory] = useState(false);
  const [showUnit, setShowUnit] = useState(true);

  if (!isOpen || !product) return null;

  const sizeConfig = TAG_SIZES.find((s) => s.value === tagSize) || TAG_SIZES[1]!;
  const previewScale = mobile ? 1.2 : 1.4;

  const renderTagPreview = () => {
    const w = sizeConfig.width * previewScale;
    const h = sizeConfig.height * previewScale;

    if (tagStyle === 'shelf') {
      return (
        <div
          className="relative flex flex-col justify-between overflow-hidden rounded"
          style={{
            width: w,
            height: h,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            padding: tagSize === 'small' ? 6 : 10,
            fontFamily: "'Inter', sans-serif",
            color: '#111',
          }}
        >
          <div>
            <div
              className="mb-0.5 overflow-hidden font-bold text-ellipsis whitespace-nowrap"
              style={{
                fontSize: tagSize === 'small' ? 8 : tagSize === 'medium' ? 10 : 12,
                lineHeight: 1.2,
              }}
            >
              {product.name}
            </div>
            {showCategory && (
              <div style={{ fontSize: tagSize === 'small' ? 6 : 7, color: '#6b7280' }}>{product.category}</div>
            )}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="font-semibold" style={{ fontSize: tagSize === 'small' ? 6 : 7, color: '#9ca3af' }}>
                PRICE
              </div>
              <div
                className="font-black"
                style={{
                  fontSize: tagSize === 'small' ? 16 : tagSize === 'medium' ? 22 : 28,
                  lineHeight: 1,
                  fontFamily: 'monospace',
                }}
              >
                <span className="align-top" style={{ fontSize: tagSize === 'small' ? 8 : 10 }}>
                  GH&#x20B5;
                </span>
                {product.price.toFixed(2)}
              </div>
              {showUnit && (
                <div style={{ fontSize: tagSize === 'small' ? 5 : 6, color: '#9ca3af' }}>per {product.unit}</div>
              )}
            </div>
            <div className="text-right">
              {showSku && (
                <div style={{ fontSize: tagSize === 'small' ? 5 : 6, color: '#9ca3af', fontFamily: 'monospace' }}>
                  {product.id}
                </div>
              )}
              {showBarcode && product.barcode && (
                <div className="mt-0.5" style={{ color: '#111' }}>
                  <BarcodeStripes
                    code={product.barcode}
                    width={tagSize === 'small' ? 50 : tagSize === 'medium' ? 70 : 90}
                    height={tagSize === 'small' ? 16 : 22}
                  />
                  <div className="text-[5px] tracking-[1px]" style={{ fontFamily: 'monospace', color: '#9ca3af' }}>
                    {product.barcode}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (tagStyle === 'hanging') {
      return (
        <div
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg text-center"
          style={{
            width: w,
            height: h,
            background: '#fff',
            border: '1.5px solid #e5e7eb',
            fontFamily: "'Inter', sans-serif",
            color: '#111',
            padding: tagSize === 'small' ? 6 : 10,
          }}
        >
          {/* Hole punch */}
          <div
            className="absolute h-2 w-2 rounded-full"
            style={{
              top: 6,
              left: '50%',
              transform: 'translateX(-50%)',
              border: '1px solid #d1d5db',
            }}
          />
          <div
            className="mt-1.5 mb-1 w-full overflow-hidden font-semibold text-ellipsis whitespace-nowrap"
            style={{
              fontSize: tagSize === 'small' ? 8 : 10,
            }}
          >
            {product.name}
          </div>
          <div
            className="font-black"
            style={{
              fontSize: tagSize === 'small' ? 20 : tagSize === 'medium' ? 28 : 36,
              lineHeight: 1,
              fontFamily: 'monospace',
            }}
          >
            <span className="align-top" style={{ fontSize: tagSize === 'small' ? 10 : 12 }}>
              GH&#x20B5;
            </span>
            {product.price.toFixed(2)}
          </div>
          {showUnit && (
            <div className="mt-0.5 text-[7px]" style={{ color: '#9ca3af' }}>
              per {product.unit}
            </div>
          )}
          {showBarcode && product.barcode && (
            <div className="mt-1" style={{ color: '#111' }}>
              <BarcodeStripes
                code={product.barcode}
                width={tagSize === 'small' ? 60 : 80}
                height={tagSize === 'small' ? 14 : 18}
              />
            </div>
          )}
        </div>
      );
    }

    // Premium card
    return (
      <div
        className="relative flex flex-col justify-between overflow-hidden rounded-[10px]"
        style={{
          width: w,
          height: h,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          padding: tagSize === 'small' ? 8 : 12,
          fontFamily: "'Inter', sans-serif",
          color: '#fff',
        }}
      >
        <div
          className="absolute h-[60px] w-[60px] rounded-full"
          style={{
            top: -20,
            right: -20,
            background: 'rgba(99,102,241,0.15)',
          }}
        />
        <div>
          <div
            className="mb-[3px] font-semibold tracking-[1.5px] uppercase"
            style={{
              fontSize: tagSize === 'small' ? 6 : 7,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            Premium Quality
          </div>
          <div
            className="overflow-hidden font-bold text-ellipsis whitespace-nowrap"
            style={{
              fontSize: tagSize === 'small' ? 9 : tagSize === 'medium' ? 11 : 13,
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </div>
          {showCategory && (
            <div className="mt-0.5 text-[7px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {product.category}
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div
              className="font-black"
              style={{
                fontSize: tagSize === 'small' ? 18 : tagSize === 'medium' ? 24 : 32,
                lineHeight: 1,
                fontFamily: 'monospace',
              }}
            >
              <span
                className="align-top"
                style={{ fontSize: tagSize === 'small' ? 9 : 11, color: 'rgba(255,255,255,0.6)' }}
              >
                GH&#x20B5;
              </span>
              {product.price.toFixed(2)}
            </div>
            {showUnit && (
              <div className="mt-0.5 text-[6px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                per {product.unit}
              </div>
            )}
          </div>
          <div className="text-right">
            {showSku && (
              <div className="text-[6px]" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                {product.id}
              </div>
            )}
            {showBarcode && product.barcode && (
              <div className="mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <BarcodeStripes
                  code={product.barcode}
                  width={tagSize === 'small' ? 50 : 65}
                  height={tagSize === 'small' ? 14 : 18}
                />
              </div>
            )}
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
        className="bg-surface z-modal fixed flex max-h-[96vh] w-[96%] flex-col overflow-hidden rounded-[12px] sm:max-h-[90vh] sm:w-[92%] sm:rounded-2xl md:w-[560px]"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
            >
              <Tag size={18} className="text-white" />
            </div>
            <div>
              <div className="text-text text-[15px] font-bold">Print Price Tag</div>
              <div className="text-text-dim text-[11px]">{product.name}</div>
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
            <div className="bg-surface-alt border-border flex min-h-[120px] items-center justify-center rounded-xl border p-6">
              {renderTagPreview()}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Tag Size */}
            <div>
              <label className="form-label mb-1.5 block">Tag Size</label>
              <div className="flex flex-col gap-1">
                {TAG_SIZES.map((s) => (
                  <div
                    key={s.value}
                    onClick={() => setTagSize(s.value)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all"
                    style={{
                      background: tagSize === s.value ? `${COLORS.primary}12` : COLORS.surfaceAlt,
                      border: `1px solid ${tagSize === s.value ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    {s.value === 'small' ? (
                      <Minimize2 size={12} className="text-text-dim" />
                    ) : s.value === 'large' ? (
                      <Maximize2 size={12} className="text-text-dim" />
                    ) : (
                      <CreditCard size={12} className="text-text-dim" />
                    )}
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: tagSize === s.value ? COLORS.primary : COLORS.text }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tag Style */}
            <div>
              <label className="form-label mb-1.5 block">Tag Style</label>
              <div className="flex flex-col gap-1">
                {TAG_STYLES.map((s) => (
                  <div
                    key={s.value}
                    onClick={() => setTagStyle(s.value)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-all"
                    style={{
                      background: tagStyle === s.value ? `${COLORS.primary}12` : COLORS.surfaceAlt,
                      border: `1px solid ${tagStyle === s.value ? COLORS.primary : COLORS.border}`,
                    }}
                  >
                    <Tag size={12} className="text-text-dim" />
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: tagStyle === s.value ? COLORS.primary : COLORS.text }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle options */}
          <div className="mt-3.5">
            <label className="form-label mb-2 block">Display Options</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Barcode', value: showBarcode, toggle: () => setShowBarcode(!showBarcode) },
                { label: 'SKU', value: showSku, toggle: () => setShowSku(!showSku) },
                { label: 'Category', value: showCategory, toggle: () => setShowCategory(!showCategory) },
                { label: 'Unit', value: showUnit, toggle: () => setShowUnit(!showUnit) },
              ].map((opt) => (
                <div
                  key={opt.label}
                  onClick={opt.toggle}
                  className="cursor-pointer rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all"
                  style={{
                    background: opt.value ? `${COLORS.primary}12` : COLORS.surfaceAlt,
                    color: opt.value ? COLORS.primary : COLORS.textMuted,
                    border: `1px solid ${opt.value ? COLORS.primary + '50' : COLORS.border}`,
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Copies */}
          <div className="mt-3.5">
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
                onClick={() => setCopies(Math.min(100, copies + 1))}
                className="bg-surface-alt border-border text-text flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-base font-bold"
              >
                +
              </div>
              <div className="ml-2 flex gap-1">
                {[1, 5, 10, 25].map((n) => (
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
        <div className="border-border flex items-center justify-between border-t px-5 py-3.5">
          <span className="text-text-dim text-[11px]">
            {copies} {copies === 1 ? 'copy' : 'copies'} · {TAG_SIZES.find((s) => s.value === tagSize)?.label} ·{' '}
            {TAG_STYLES.find((s) => s.value === tagStyle)?.label}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Printer}
              onClick={() => {
                window.print();
              }}
            >
              Print Tags
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
