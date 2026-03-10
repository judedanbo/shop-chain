import { useState } from 'react';
import { Tag, Plus, Search, Eye, Edit, Trash2, X, CheckCircle, Clock, AlertTriangle, Save } from 'lucide-react';
import clsx from 'clsx';
import { useColors, useNavigation } from '@/context';
import { useBreakpoint } from '@/hooks';
import { paginate } from '@/utils/pagination';
import { Card, Badge, Button, Input, Paginator, TabButton } from '@/components/ui';
import type { Product, Category } from '@/types';

interface CategoriesPageProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  products: Product[];
}

export const CategoriesPage = ({ categories, setCategories, products }: CategoriesPageProps) => {
  const bp = useBreakpoint();
  const { setPage } = useNavigation();
  const COLORS = useColors();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [tblPage, setTblPage] = useState(1);

  const EMOJI_OPTIONS = [
    '\u{1F35A}',
    '\u2615',
    '\u{1F95B}',
    '\u{1FAD2}',
    '\u{1F41F}',
    '\u{1F9FC}',
    '\u{1F35D}',
    '\u{1F9CA}',
    '\u{1F36C}',
    '\u{1F36A}',
    '\u{1F9F4}',
    '\u{1F37C}',
    '\u{1F969}',
    '\u{1F96C}',
    '\u{1F9C8}',
    '\u{1F36F}',
    '\u{1F96B}',
    '\u{1F9C3}',
    '\u{1F35E}',
    '\u{1F95A}',
    '\u{1F33D}',
    '\u{1F9C2}',
    '\u{1F34E}',
    '\u{1F964}',
    '\u{1FAE7}',
    '\u{1F3E0}',
    '\u{1F48A}',
    '\u{1F4E6}',
    '\u{1F381}',
    '\u{1F9F9}',
  ];
  const COLOR_OPTIONS = [
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

  const filtered = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getProductCount = (catName: string) => products.filter((p) => p.category === catName).length;
  const getStockValue = (catName: string) =>
    products.filter((p) => p.category === catName).reduce((s, p) => s + p.price * p.stock, 0);

  const handleSave = (catData: Omit<Category, 'id'>) => {
    if (editingCat) {
      setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? { ...c, ...catData } : c)));
    } else {
      const newCat: Category = { ...catData, id: `cat-${String(Date.now()).slice(-6)}` };
      setCategories((prev) => [...prev, newCat]);
    }
    setShowModal(false);
    setEditingCat(null);
  };

  const handleDelete = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    const count = getProductCount(cat.name);
    if (count > 0) {
      setDeletingCat(cat);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  };

  const toggleStatus = (catId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, status: c.status === 'active' ? ('inactive' as const) : ('active' as const) } : c,
      ),
    );
  };

  const activeCount = categories.filter((c) => c.status === 'active').length;
  const inactiveCount = categories.filter((c) => c.status === 'inactive').length;
  const uncategorised = products.filter((p) => !categories.find((c) => c.name === p.category)).length;

  // ─── Category Form Modal ───
  const CategoryModal = () => {
    const [name, setName] = useState(editingCat ? editingCat.name : '');
    const [icon, setIcon] = useState(editingCat ? editingCat.icon : '\u{1F4E6}');
    const [color, setColor] = useState(editingCat ? editingCat.color : '#3B82F6');
    const [desc, setDesc] = useState(editingCat ? editingCat.description : '');
    const [status, setStatus] = useState<'active' | 'inactive'>(
      editingCat ? (editingCat.status as 'active' | 'inactive') : 'active',
    );
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const isValid = name.trim() && desc.trim();
    const isDuplicate = !editingCat && categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());

    return (
      <>
        <div
          onClick={() => {
            setShowModal(false);
            setEditingCat(null);
          }}
          aria-hidden="true"
          className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
        />
        <div
          className="bg-surface z-modal fixed top-1/2 left-1/2 flex max-h-screen w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none sm:max-h-[90vh] sm:w-[94%] sm:rounded-[18px] md:w-[520px]"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'modalIn 0.25s ease',
          }}
        >
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-6 py-[18px]">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px] text-xl"
                style={{ background: color + '20' }}
              >
                {icon}
              </div>
              <div>
                <div className="text-text text-base font-bold">{editingCat ? 'Edit Category' : 'Add Category'}</div>
                <div className="text-text-dim text-[11px]">
                  {editingCat ? 'Update category details' : 'Create a new product category'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingCat(null);
              }}
              aria-label="Close"
              className="bg-surface-alt flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <X size={16} className="text-text-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 overflow-y-auto p-6">
            {/* Icon + Color Row */}
            <div className="flex gap-4">
              <div className="flex-[0]">
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                  Icon
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="relative flex h-14 w-14 items-center justify-center rounded-xl text-[28px] transition-all duration-150"
                  style={{
                    background: color + '18',
                    border: `2px dashed ${color}50`,
                  }}
                >
                  {icon}
                </button>
                {showEmojiPicker && (
                  <div
                    className="bg-surface border-border absolute z-10 mt-1 grid w-[220px] grid-cols-6 gap-1 rounded-xl border p-2.5"
                    style={{
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}
                  >
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        type="button"
                        key={e}
                        onClick={() => {
                          setIcon(e);
                          setShowEmojiPicker(false);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                        style={{
                          background: icon === e ? color + '20' : 'transparent',
                          border: icon === e ? `1px solid ${color}50` : '1px solid transparent',
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                  Color
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      aria-label={`Select color ${c}`}
                      className="h-[26px] w-[26px] rounded-lg transition-all duration-150"
                      style={{
                        background: c,
                        border: color === c ? `2.5px solid ${COLORS.text}` : '2.5px solid transparent',
                        boxShadow: color === c ? `0 0 0 2px ${c}50` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                Category Name *
              </label>
              <Input
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="e.g. Frozen Foods"
              />
              {isDuplicate && (
                <div className="text-danger mt-1 text-[11px]">A category with this name already exists</div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                Description *
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief description of what products belong in this category"
                rows={2}
                className="bg-surface-alt border-border text-text box-border w-full resize-y rounded-[10px] border px-3 py-2.5 font-[inherit] text-[13px] outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                Status
              </label>
              <div className="flex gap-2">
                {(['active', 'inactive'] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStatus(s)}
                    className={clsx(
                      'flex flex-1 items-center gap-2 rounded-[10px] px-3.5 py-2.5 transition-all duration-150',
                      status === s ? (s === 'active' ? 'bg-success-bg' : 'bg-warning-bg') : '',
                    )}
                    style={{
                      border: `1.5px solid ${status === s ? (s === 'active' ? COLORS.success : COLORS.warning) : COLORS.border}`,
                    }}
                  >
                    <div className={clsx('h-2 w-2 rounded-full', s === 'active' ? 'bg-success' : 'bg-warning')} />
                    <span
                      className={clsx(
                        'text-[13px] font-semibold capitalize',
                        status === s ? 'text-text' : 'text-text-muted',
                      )}
                    >
                      {s}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="bg-surface-alt border-border rounded-xl border p-3.5">
              <div className="form-label mb-2">Preview</div>
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[10px] text-xl"
                  style={{ background: color + '20' }}
                >
                  {icon}
                </div>
                <div>
                  <div className="text-text text-sm font-semibold">{name || 'Category Name'}</div>
                  <div className="text-text-dim text-[11px]">{desc || 'Category description'}</div>
                </div>
                <span className="ml-auto">
                  <Badge color={status === 'active' ? 'success' : 'warning'}>{status}</Badge>
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingCat(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={editingCat ? Save : Plus}
              onClick={() => handleSave({ name: name.trim(), icon, color, description: desc.trim(), status })}
              disabled={!isValid || isDuplicate}
            >
              {editingCat ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-[14px] flex flex-wrap items-center justify-between gap-2.5 md:mb-5">
        <div className="flex items-center gap-2.5 md:gap-3.5">
          <div className="bg-primary-bg flex h-10 w-10 items-center justify-center rounded-xl md:h-12 md:w-12">
            <Tag size={bp === 'sm' ? 20 : 24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-text m-0 text-[17px] font-bold md:text-[22px]">Product Categories</h2>
            <div className="text-text-dim mt-0.5 text-xs">Organize products into categories for easy management</div>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingCat(null);
            setShowModal(true);
          }}
        >
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-[14px] grid grid-cols-2 gap-2 md:mb-5 md:grid-cols-4 md:gap-3">
        {[
          { label: 'Total Categories', value: categories.length, icon: Tag, color: COLORS.primary },
          { label: 'Active', value: activeCount, icon: CheckCircle, color: COLORS.success },
          { label: 'Inactive', value: inactiveCount, icon: Clock, color: COLORS.warning },
          {
            label: 'Uncategorised',
            value: uncategorised,
            icon: AlertTriangle,
            color: uncategorised > 0 ? COLORS.danger : COLORS.textDim,
          },
        ].map((s, i) => (
          <Card key={i} className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="form-label font-semibold tracking-[0.8px]">{s.label}</div>
                <div className="text-text mt-0.5 text-xl font-bold md:text-[26px]">{s.value}</div>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ background: s.color + '18' }}
              >
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <div className="max-w-[300px] min-w-[150px] flex-1">
          <Input
            icon={Search}
            placeholder="Search categories..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <TabButton
              key={s}
              active={filterStatus === s}
              variant="filter"
              onClick={() => setFilterStatus(s)}
              className="px-3.5 py-[7px] capitalize"
            >
              {s} {s === 'all' ? `(${categories.length})` : s === 'active' ? `(${activeCount})` : `(${inactiveCount})`}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Category Grid */}
      <div className="xl2:grid-cols-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3.5 lg:grid-cols-3">
        {paginate(filtered, tblPage, 8).items.map((cat) => {
          const prodCount = getProductCount(cat.name);
          const stockVal = getStockValue(cat.name);
          return (
            <Card key={cat.id} className="overflow-hidden p-0">
              {/* Color stripe */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}80)` }} />
              <div className="p-[14px] md:p-[18px]">
                {/* Top row */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] text-[22px]"
                      style={{ background: cat.color + '18' }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <div className="text-text text-sm font-bold">{cat.name}</div>
                      <div className="text-text-dim mt-px text-[11px] leading-tight">{cat.description}</div>
                    </div>
                  </div>
                  <Badge color={cat.status === 'active' ? 'success' : 'warning'}>{cat.status}</Badge>
                </div>

                {/* Stats row */}
                <div className="mb-3.5 flex gap-2">
                  <div className="bg-surface-alt flex-1 rounded-lg px-2.5 py-2 text-center">
                    <div className="text-text text-base font-bold">{prodCount}</div>
                    <div className="text-text-dim text-[9px] font-semibold tracking-[0.5px] uppercase">Products</div>
                  </div>
                  <div className="bg-surface-alt flex-1 rounded-lg px-2.5 py-2 text-center">
                    <div className="text-text font-mono text-sm font-bold">
                      GH₵ {stockVal >= 1000 ? (stockVal / 1000).toFixed(1) + 'k' : stockVal.toFixed(0)}
                    </div>
                    <div className="text-text-dim text-[9px] font-semibold tracking-[0.5px] uppercase">Stock Value</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Eye}
                    onClick={() => setPage('products')}
                    className="flex-1 justify-center"
                  >
                    Products
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => {
                      setEditingCat(cat);
                      setShowModal(true);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={cat.status === 'active' ? Clock : CheckCircle}
                    onClick={() => toggleStatus(cat.id)}
                    className={cat.status === 'active' ? 'text-warning' : 'text-success'}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(cat.id)}
                    className="text-danger"
                  />
                </div>
              </div>
            </Card>
          );
        })}

        {/* Add category card */}
        <button
          type="button"
          onClick={() => {
            setEditingCat(null);
            setShowModal(true);
          }}
          className="border-border hover:border-primary hover:bg-primary-bg flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed p-[30px] transition-all duration-200"
        >
          <div className="bg-surface-alt flex h-10 w-10 items-center justify-center rounded-full">
            <Plus size={20} className="text-text-dim" />
          </div>
          <span className="text-text-dim text-[13px] font-semibold">Add Category</span>
        </button>
      </div>
      <Paginator {...paginate(filtered, tblPage, 8)} perPage={8} onPage={(v: number) => setTblPage(v)} />

      {filtered.length === 0 && search && (
        <div className="text-text-dim p-10 text-center">
          <Tag size={32} className="text-border mb-2" />
          <div className="text-sm font-semibold">No categories match "{search}"</div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && <CategoryModal />}

      {/* Cannot Delete Modal */}
      {deletingCat && (
        <>
          <div
            onClick={() => setDeletingCat(null)}
            aria-hidden="true"
            className="z-modal-backdrop fixed inset-0 bg-black/50"
            style={{ backdropFilter: 'blur(3px)' }}
          />
          <div
            className="bg-surface z-modal fixed top-1/2 left-1/2 w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 sm:w-[420px]"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'modalIn 0.25s ease',
            }}
          >
            <div className="mb-3.5 flex items-center gap-2.5">
              <div className="bg-danger-bg flex h-10 w-10 items-center justify-center rounded-[10px]">
                <AlertTriangle size={20} className="text-danger" />
              </div>
              <div>
                <div className="text-text text-base font-bold">Cannot Delete Category</div>
                <div className="text-text-dim text-xs">This category still has products assigned</div>
              </div>
            </div>
            <div className="bg-surface-alt mb-4 rounded-[10px] p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-lg">{deletingCat.icon}</span>
                <span className="text-text text-sm font-bold">{deletingCat.name}</span>
              </div>
              <div className="text-text-muted text-xs">
                <strong>{getProductCount(deletingCat.name)}</strong> product
                {getProductCount(deletingCat.name) !== 1 ? 's' : ''} are assigned to this category. Please reassign or
                remove them before deleting.
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setDeletingCat(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={Eye}
                onClick={() => {
                  setDeletingCat(null);
                  setPage('products');
                }}
              >
                View Products
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
