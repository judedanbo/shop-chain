import React, { useState } from 'react';
import { X, Plus, Ruler } from 'lucide-react';
import { useColors } from '@/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface UnitData {
  name: string;
  abbreviation: string;
  type: string;
  description: string;
}

interface QuickAddUnitModalProps {
  units: UnitData[];
  onClose: () => void;
  onSave: (unit: UnitData) => void;
}

const UNIT_TYPES = [
  { value: 'weight', label: 'Weight' },
  { value: 'volume', label: 'Volume' },
  { value: 'length', label: 'Length' },
  { value: 'count', label: 'Count' },
];

const UNIT_SUGGESTIONS: Record<string, Array<{ name: string; abbr: string }>> = {
  weight: [
    { name: 'Kilogram', abbr: 'kg' },
    { name: 'Gram', abbr: 'g' },
    { name: 'Pound', abbr: 'lb' },
    { name: 'Ounce', abbr: 'oz' },
    { name: 'Tonne', abbr: 't' },
  ],
  volume: [
    { name: 'Litre', abbr: 'L' },
    { name: 'Millilitre', abbr: 'mL' },
    { name: 'Gallon', abbr: 'gal' },
    { name: 'Cup', abbr: 'cup' },
  ],
  length: [
    { name: 'Metre', abbr: 'm' },
    { name: 'Centimetre', abbr: 'cm' },
    { name: 'Inch', abbr: 'in' },
    { name: 'Foot', abbr: 'ft' },
  ],
  count: [
    { name: 'Piece', abbr: 'pc' },
    { name: 'Pack', abbr: 'pk' },
    { name: 'Box', abbr: 'bx' },
    { name: 'Dozen', abbr: 'dz' },
    { name: 'Carton', abbr: 'ctn' },
    { name: 'Bottle', abbr: 'btl' },
    { name: 'Can', abbr: 'can' },
    { name: 'Sachet', abbr: 'sac' },
    { name: 'Bag', abbr: 'bag' },
    { name: 'Tin', abbr: 'tin' },
  ],
};

export const QuickAddUnitModal: React.FC<QuickAddUnitModalProps> = ({ units, onClose, onSave }) => {
  const COLORS = useColors();
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [type, setType] = useState('count');
  const [description, setDescription] = useState('');

  const isDuplicate = units.some(
    (u) =>
      u.name.toLowerCase() === name.trim().toLowerCase() ||
      u.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase(),
  );
  const isValid = name.trim() && abbreviation.trim() && description.trim() && !isDuplicate;

  const suggestions = UNIT_SUGGESTIONS[type] || [];

  const handleSuggestionClick = (suggestion: { name: string; abbr: string }) => {
    setName(suggestion.name);
    setAbbreviation(suggestion.abbr);
  };

  return (
    <>
      <div
        aria-hidden="true"
        className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div
        className="bg-surface z-modal fixed top-1/2 left-1/2 w-[96%] overflow-hidden rounded-2xl sm:w-[460px]"
        style={{
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'modalIn 0.25s ease',
        }}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/[0.09] flex h-8 w-8 items-center justify-center rounded-lg">
              <Ruler size={16} className="text-primary" />
            </div>
            <div className="text-text text-[15px] font-bold">New Unit of Measure</div>
          </div>
          <div
            onClick={onClose}
            className="bg-surface-alt flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
          >
            <X size={14} className="text-text-muted" />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 px-5 py-4">
          {/* Type */}
          <div>
            <label className="form-label mb-1 block">Type *</label>
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setName('');
                setAbbreviation('');
              }}
              options={UNIT_TYPES}
            />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <label className="form-label mb-1.5 block">Quick Pick</label>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => {
                  const isSelected = name === s.name && abbreviation === s.abbr;
                  return (
                    <div
                      key={s.abbr}
                      onClick={() => handleSuggestionClick(s)}
                      className="cursor-pointer rounded-lg px-2.5 py-[5px] text-[11px] font-semibold transition-all duration-150"
                      style={{
                        background: isSelected ? `${COLORS.primary}20` : COLORS.surfaceAlt,
                        color: isSelected ? COLORS.primary : COLORS.textMuted,
                        border: `1px solid ${isSelected ? COLORS.primary + '50' : COLORS.border}`,
                      }}
                    >
                      {s.name} <span className="font-mono opacity-70">({s.abbr})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name & Abbreviation */}
          <div className="flex gap-3">
            <div className="flex-[2]">
              <label className="form-label mb-1 block">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kilogram" />
            </div>
            <div className="flex-1">
              <label className="form-label mb-1 block">Abbreviation *</label>
              <Input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value)}
                placeholder="e.g. kg"
                className="text-center font-mono font-bold"
              />
            </div>
          </div>

          {isDuplicate && (
            <div className="text-danger -mt-2 text-[11px]">A unit with this name or abbreviation already exists</div>
          )}

          {/* Description */}
          <div>
            <label className="form-label mb-1 block">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this unit"
              rows={2}
              className="bg-surface-alt border-border text-text box-border w-full resize-none rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
            />
          </div>

          {/* Preview */}
          {name.trim() && abbreviation.trim() && (
            <div className="bg-surface-alt border-border rounded-[10px] border px-3.5 py-2.5">
              <div className="form-label mb-1.5">Preview</div>
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/[0.08] flex h-9 w-9 items-center justify-center rounded-lg">
                  <span className="text-primary font-mono text-[13px] font-extrabold">{abbreviation.trim()}</span>
                </div>
                <div>
                  <div className="text-text text-[13px] font-bold">{name.trim()}</div>
                  <div className="text-text-dim text-[11px]">
                    {UNIT_TYPES.find((t) => t.value === type)?.label || type}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-border flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() =>
              onSave({ name: name.trim(), abbreviation: abbreviation.trim(), type, description: description.trim() })
            }
            disabled={!isValid}
          >
            Add Unit
          </Button>
        </div>
      </div>
    </>
  );
};
