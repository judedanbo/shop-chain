import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useColors } from '@/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CategoryData {
  name: string;
  icon: string;
  color: string;
  description: string;
  status: string;
}

interface QuickAddCategoryModalProps {
  categories: CategoryData[];
  onClose: () => void;
  onSave: (category: CategoryData) => void;
}

const EMOJI_OPTS = [
  '🍚',
  '☕',
  '🥛',
  '🫒',
  '🐟',
  '🧼',
  '🍝',
  '🧊',
  '🍬',
  '🍪',
  '🧴',
  '🍼',
  '🥩',
  '🥬',
  '🧈',
  '🍯',
  '🥫',
  '🧃',
  '🍞',
  '🥚',
  '🌽',
  '🧂',
  '🍎',
  '🥤',
  '🫧',
  '🏠',
  '💊',
  '📦',
  '🎁',
  '🧹',
];
const COLOR_OPTS = [
  '#F59E0B',
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#EF4444',
  '#06B6D4',
  '#F97316',
  '#6366F1',
  '#EC4899',
  '#D97706',
  '#14B8A6',
  '#A78BFA',
  '#0EA5E9',
  '#84CC16',
  '#F43F5E',
  '#7C3AED',
];

export const QuickAddCategoryModal: React.FC<QuickAddCategoryModalProps> = ({ categories, onClose, onSave }) => {
  const COLORS = useColors();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#3B82F6');
  const [desc, setDesc] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const isDuplicate = categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  const isValid = name.trim() && desc.trim() && !isDuplicate;

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
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{ background: color + '20' }}
            >
              {icon}
            </div>
            <div className="text-text text-[15px] font-bold">New Category</div>
          </div>
          <div
            onClick={onClose}
            className="bg-surface-alt flex h-7 w-7 cursor-pointer items-center justify-center rounded-md"
          >
            <X size={14} className="text-text-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-3.5 px-5 py-4">
          <div className="flex gap-3">
            <div>
              <label className="form-label mb-1 block">Icon</label>
              <div
                onClick={() => setShowEmojis(!showEmojis)}
                className="relative flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[10px] text-[22px]"
                style={{ background: color + '18', border: `2px dashed ${color}50` }}
              >
                {icon}
              </div>
              {showEmojis && (
                <div
                  className="bg-surface border-border absolute z-10 mt-1 grid w-[200px] grid-cols-6 gap-[3px] rounded-[10px] border p-2"
                  style={{
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  }}
                >
                  {EMOJI_OPTS.map((e) => (
                    <div
                      key={e}
                      onClick={() => {
                        setIcon(e);
                        setShowEmojis(false);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-base"
                      style={{ background: icon === e ? color + '20' : 'transparent' }}
                    >
                      {e}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="form-label mb-1 block">Color</label>
              <div className="flex flex-wrap gap-[5px]">
                {COLOR_OPTS.map((c) => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    className="h-[22px] w-[22px] cursor-pointer rounded-md"
                    style={{
                      background: c,
                      border: color === c ? `2.5px solid ${COLORS.text}` : '2.5px solid transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="form-label mb-1 block">Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frozen Foods" />
            {isDuplicate && <div className="text-danger mt-[3px] text-[11px]">Already exists</div>}
          </div>
          <div>
            <label className="form-label mb-1 block">Description *</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className="bg-surface-alt border-border text-text box-border w-full resize-none rounded-lg border px-2.5 py-2 font-[inherit] text-xs outline-none"
            />
          </div>
        </div>
        <div className="border-border flex justify-end gap-2 border-t px-5 py-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => onSave({ name: name.trim(), icon, color, description: desc.trim(), status: 'active' })}
            disabled={!isValid}
          >
            Add Category
          </Button>
        </div>
      </div>
    </>
  );
};
