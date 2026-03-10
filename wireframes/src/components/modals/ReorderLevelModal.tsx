import React, { useState } from 'react';
import { Layers, Save, CheckCircle, X, TrendingUp, ShieldCheck, Gauge, Package } from 'lucide-react';
import clsx from 'clsx';
import { useColors } from '@/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types';

type SuggestionType = 'conservative' | 'moderate' | 'aggressive' | 'match_stock';
type MethodType = 'manual' | 'suggested';

interface ReorderLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (productId: string, reorderLevel: number, reason: string) => void;
}

interface Suggestion {
  label: string;
  type: SuggestionType;
  value: number;
  description: string;
  color: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
}

const REASON_OPTIONS = [
  { value: '', label: 'Select a reason...' },
  { value: 'seasonal_demand', label: 'Seasonal demand change' },
  { value: 'supplier_lead_time', label: 'Supplier lead time changed' },
  { value: 'sales_increase', label: 'Sales volume increased' },
  { value: 'sales_decrease', label: 'Sales volume decreased' },
  { value: 'storage_constraint', label: 'Storage constraint' },
  { value: 'cost_optimization', label: 'Cost optimization' },
  { value: 'new_product', label: 'New product setup' },
  { value: 'other', label: 'Other' },
];

export const ReorderLevelModal: React.FC<ReorderLevelModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const COLORS = useColors();

  const [method, setMethod] = useState<MethodType>('manual');
  const [manualValue, setManualValue] = useState<string>(product?.reorder?.toString() || '0');
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionType | null>(null);
  const [reason, setReason] = useState('');

  if (!isOpen || !product) return null;

  const currentReorder = product.reorder;
  const currentStock = product.stock;

  const suggestions: Suggestion[] = [
    {
      label: 'Conservative',
      type: 'conservative',
      value: Math.max(Math.round(currentStock * 0.4), 10),
      description: 'Higher safety stock. Reorder at 40% of current stock level. Reduces stockout risk.',
      color: '#3B82F6',
      icon: ShieldCheck,
    },
    {
      label: 'Moderate',
      type: 'moderate',
      value: Math.max(Math.round(currentStock * 0.25), 5),
      description: 'Balanced approach. Reorder at 25% of current stock. Good for most products.',
      color: '#10B981',
      icon: Gauge,
    },
    {
      label: 'Aggressive',
      type: 'aggressive',
      value: Math.max(Math.round(currentStock * 0.1), 3),
      description: 'Lean inventory. Reorder at 10% of stock. Lower holding costs but higher risk.',
      color: '#F59E0B',
      icon: TrendingUp,
    },
    {
      label: 'Match Stock',
      type: 'match_stock',
      value: currentStock,
      description: 'Set reorder point to current stock level. Triggers immediate reorder alert.',
      color: '#8B5CF6',
      icon: Package,
    },
  ];

  const finalValue =
    method === 'manual'
      ? parseInt(manualValue) || 0
      : suggestions.find((s) => s.type === selectedSuggestion)?.value || currentReorder;

  const change = finalValue - currentReorder;
  const changePercent = currentReorder > 0 ? Math.round((change / currentReorder) * 100) : 0;
  const isValid = finalValue >= 0 && finalValue !== currentReorder && reason !== '';

  const handleSave = () => {
    onSave(product.id, finalValue, reason);
    onClose();
  };

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
      />
      <div
        className="bg-surface z-modal fixed flex max-h-[96vh] w-[96%] flex-col overflow-hidden rounded-[12px] sm:max-h-[90vh] sm:w-[92%] sm:rounded-2xl md:w-[520px]"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
            >
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <div className="text-text text-[15px] font-bold">Set Reorder Level</div>
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
          {/* Current Stats Grid */}
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <div className="bg-surface-alt rounded-[10px] px-3 py-2.5 text-center">
              <div className="form-label mb-1 tracking-[0.8px]">Current Stock</div>
              <div className="text-text font-mono text-lg font-extrabold">{currentStock}</div>
              <div className="text-text-dim text-[10px]">{product.unit}</div>
            </div>
            <div className="bg-surface-alt rounded-[10px] px-3 py-2.5 text-center">
              <div className="form-label mb-1 tracking-[0.8px]">Current Reorder</div>
              <div className="text-warning font-mono text-lg font-extrabold">{currentReorder}</div>
              <div className="text-text-dim text-[10px]">{product.unit}</div>
            </div>
            <div className="bg-surface-alt rounded-[10px] px-3 py-2.5 text-center">
              <div className="form-label mb-1 tracking-[0.8px]">Status</div>
              <Badge
                color={
                  product.status === 'in_stock' ? 'success' : product.status === 'low_stock' ? 'warning' : 'danger'
                }
              >
                {product.status === 'in_stock' ? 'In Stock' : product.status === 'low_stock' ? 'Low' : 'Out'}
              </Badge>
            </div>
          </div>

          {/* Method Toggle */}
          <div className="bg-surface-alt mb-4 flex gap-1 rounded-[10px] p-[3px]">
            {(['manual', 'suggested'] as MethodType[]).map((m) => (
              <div
                key={m}
                onClick={() => {
                  setMethod(m);
                  if (m === 'manual') setSelectedSuggestion(null);
                }}
                className={clsx(
                  'flex-1 cursor-pointer rounded-lg px-3 py-2 text-center text-xs font-semibold transition-all duration-200',
                  method === m ? 'text-text' : 'text-text-muted',
                )}
                style={{
                  background: method === m ? COLORS.surface : 'transparent',
                  boxShadow: method === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {m === 'manual' ? 'Manual Entry' : 'Suggestions'}
              </div>
            ))}
          </div>

          {/* Manual Entry */}
          {method === 'manual' && (
            <div className="mb-4">
              <label className="form-label mb-1.5 block">New Reorder Level</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder="Enter quantity"
                  className="px-3.5 py-3 text-center font-mono text-lg font-bold"
                />
                <span className="text-text-dim text-[13px] font-semibold whitespace-nowrap">{product.unit}</span>
              </div>
              {/* Quick adjust buttons */}
              <div className="mt-2 flex gap-1.5">
                {[-10, -5, -1, 1, 5, 10].map((n) => (
                  <div
                    key={n}
                    onClick={() => setManualValue(String(Math.max(0, (parseInt(manualValue) || 0) + n)))}
                    className="flex-1 cursor-pointer rounded-[6px] py-1.5 text-center text-[11px] font-bold transition-all duration-150"
                    style={{
                      background: n > 0 ? `${COLORS.success}12` : `${COLORS.danger}12`,
                      color: n > 0 ? COLORS.success : COLORS.danger,
                      border: `1px solid ${n > 0 ? COLORS.success : COLORS.danger}25`,
                    }}
                  >
                    {n > 0 ? `+${n}` : n}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {method === 'suggested' && (
            <div className="mb-4 flex flex-col gap-2">
              {suggestions.map((s) => {
                const Icon = s.icon;
                const isSelected = selectedSuggestion === s.type;
                return (
                  <div
                    key={s.type}
                    onClick={() => setSelectedSuggestion(s.type)}
                    className="cursor-pointer rounded-xl px-3.5 py-3 transition-all duration-200"
                    style={{
                      background: isSelected ? `${s.color}12` : COLORS.surfaceAlt,
                      border: `1.5px solid ${isSelected ? s.color : COLORS.border}`,
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-[7px]"
                          style={{ background: `${s.color}18` }}
                        >
                          <Icon size={14} style={{ color: s.color }} />
                        </div>
                        <span className="text-text text-[13px] font-bold">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-base font-extrabold" style={{ color: s.color }}>
                          {s.value}
                        </span>
                        <span className="text-text-dim text-[11px]">{product.unit}</span>
                        {isSelected && <CheckCircle size={16} className="ml-1" style={{ color: s.color }} />}
                      </div>
                    </div>
                    <div className="text-text-muted pl-9 text-[11px] leading-[1.4]">{s.description}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Change Preview */}
          {finalValue !== currentReorder && (
            <div
              className="mb-3.5 rounded-[10px] px-3.5 py-2.5"
              style={{
                background: change > 0 ? `${COLORS.success}08` : `${COLORS.danger}08`,
                border: `1px solid ${change > 0 ? COLORS.success : COLORS.danger}20`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-text-muted text-xs font-semibold">Change</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-dim text-[13px] font-semibold line-through">{currentReorder}</span>
                  <span className="text-text-dim text-xs">&rarr;</span>
                  <span
                    className="font-mono text-[15px] font-extrabold"
                    style={{ color: change > 0 ? COLORS.success : COLORS.danger }}
                  >
                    {finalValue}
                  </span>
                  <Badge color={change > 0 ? 'success' : 'danger'}>
                    {change > 0 ? '+' : ''}
                    {change} ({changePercent > 0 ? '+' : ''}
                    {changePercent}%)
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Reason Select */}
          <div>
            <label className="form-label mb-1.5 block">Reason for Change *</label>
            <Select value={reason} onChange={(e) => setReason(e.target.value)} options={REASON_OPTIONS} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-border flex justify-end gap-2 border-t px-5 py-3.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={!isValid}>
            Save Reorder Level
          </Button>
        </div>
      </div>
    </>
  );
};
