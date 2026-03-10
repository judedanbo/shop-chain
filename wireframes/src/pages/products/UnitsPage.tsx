import { useState } from 'react';
import { Ruler, Plus, Search, Edit, Trash2, X, CheckCircle, Clock, Layers, Save, Box } from 'lucide-react';
import clsx from 'clsx';
import { useColors } from '@/context';
import { useBreakpoint } from '@/hooks';
import { isMobile } from '@/utils/responsive';
import { paginate } from '@/utils/pagination';
import { Card, Badge, Button, Input, Paginator, TabButton } from '@/components/ui';
import type { Product, UnitOfMeasure } from '@/types';

interface UnitsPageProps {
  units: UnitOfMeasure[];
  setUnits: React.Dispatch<React.SetStateAction<UnitOfMeasure[]>>;
  products: Product[];
}

const UOM_TYPES = ['Weight', 'Volume', 'Length', 'Count'] as const;
const UOM_ICONS: Record<string, string> = {
  Weight: '\u2696\uFE0F',
  Volume: '\u{1F9EA}',
  Length: '\u{1F4CF}',
  Count: '\u{1F522}',
};

export const UnitsPage = ({ units, setUnits, products }: UnitsPageProps) => {
  const COLORS = useColors();
  const bp = useBreakpoint();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [tblPage, setTblPage] = useState(1);
  const mobile = isMobile(bp);

  const filtered = units.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.abbreviation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    const matchType = filterType === 'all' || u.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const getProductCount = (abbr: string) => products.filter((p) => p.unit === abbr).length;

  const handleSave = (unitData: Omit<UnitOfMeasure, 'id'>) => {
    if (editingUnit) {
      setUnits((prev) => prev.map((u) => (u.id === editingUnit.id ? { ...u, ...unitData } : u)));
    } else {
      const newUnit: UnitOfMeasure = { ...unitData, id: `uom-${String(Date.now()).slice(-6)}` };
      setUnits((prev) => [...prev, newUnit]);
    }
    setShowModal(false);
    setEditingUnit(null);
  };

  const handleDelete = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    if (!unit || getProductCount(unit.abbreviation) > 0) return;
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
  };

  const toggleStatus = (unitId: string) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId ? { ...u, status: u.status === 'active' ? ('inactive' as const) : ('active' as const) } : u,
      ),
    );
  };

  const activeCount = units.filter((u) => u.status === 'active').length;
  const inactiveCount = units.filter((u) => u.status === 'inactive').length;
  const typeGroups = UOM_TYPES.map((t) => ({ type: t, count: units.filter((u) => u.type === t).length }));

  // ─── Unit Form Modal ───
  const UnitModal = () => {
    const [name, setName] = useState(editingUnit ? editingUnit.name : '');
    const [abbreviation, setAbbreviation] = useState(editingUnit ? editingUnit.abbreviation : '');
    const [type, setType] = useState(editingUnit ? editingUnit.type : 'Count');
    const [desc, setDesc] = useState(editingUnit ? editingUnit.description : '');
    const [status, setStatus] = useState<'active' | 'inactive'>(
      editingUnit ? (editingUnit.status as 'active' | 'inactive') : 'active',
    );

    const isValid = name.trim() && abbreviation.trim() && desc.trim();
    const isDuplicate =
      !editingUnit && units.some((u) => u.abbreviation.toLowerCase() === abbreviation.trim().toLowerCase());

    return (
      <>
        <div
          onClick={() => {
            setShowModal(false);
            setEditingUnit(null);
          }}
          aria-hidden="true"
          className="z-modal-backdrop fixed inset-0 bg-black/50 backdrop-blur-[3px]"
        />
        <div
          className="bg-surface z-modal fixed top-1/2 left-1/2 flex max-h-screen w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-none sm:max-h-[90vh] sm:w-[94%] sm:rounded-[18px] md:w-[500px]"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            animation: 'modalIn 0.25s ease',
          }}
        >
          {/* Header */}
          <div className="border-border flex items-center justify-between border-b px-6 py-[18px]">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary-bg flex h-9 w-9 items-center justify-center rounded-[10px]">
                <Ruler size={18} className="text-primary" />
              </div>
              <div>
                <div className="text-text text-base font-bold">{editingUnit ? 'Edit Unit' : 'Add Unit of Measure'}</div>
                <div className="text-text-dim text-[11px]">
                  {editingUnit ? 'Update unit details' : 'Define a new measurement unit'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingUnit(null);
              }}
              aria-label="Close"
              className="bg-surface-alt flex h-8 w-8 items-center justify-center rounded-lg"
            >
              <X size={16} className="text-text-muted" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-4 overflow-y-auto p-6">
            <div className="grid grid-cols-[2fr_1fr] gap-3">
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                  Unit Name *
                </label>
                <Input
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="e.g. Kilograms"
                />
              </div>
              <div>
                <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                  Abbreviation *
                </label>
                <Input
                  value={abbreviation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAbbreviation(e.target.value)}
                  placeholder="e.g. kg"
                />
                {isDuplicate && <div className="text-danger mt-1 text-[11px]">This abbreviation already exists</div>}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                Measurement Type *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {UOM_TYPES.map((t) => {
                  const sel = type === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={clsx(
                        'flex min-w-[80px] flex-1 items-center gap-1.5 rounded-[10px] px-3 py-2.5 transition-all duration-150',
                        sel ? 'bg-primary-bg' : 'bg-transparent',
                      )}
                      style={{
                        border: `1.5px solid ${sel ? COLORS.primary : COLORS.border}`,
                      }}
                    >
                      <span className="text-sm">{UOM_ICONS[t]}</span>
                      <span className={clsx('text-xs font-semibold', sel ? 'text-primary' : 'text-text-muted')}>
                        {t}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                Description *
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief description of this unit"
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
          </div>

          {/* Footer */}
          <div className="border-border flex justify-end gap-2.5 border-t px-6 py-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingUnit(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={editingUnit ? Save : Plus}
              onClick={() =>
                handleSave({
                  name: name.trim(),
                  abbreviation: abbreviation.trim(),
                  type,
                  description: desc.trim(),
                  status,
                })
              }
              disabled={!isValid || isDuplicate}
            >
              {editingUnit ? 'Update Unit' : 'Add Unit'}
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
            <Ruler size={bp === 'sm' ? 20 : 24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-text m-0 text-[17px] font-bold md:text-[22px]">Units of Measure</h2>
            <div className="text-text-dim mt-0.5 text-xs">Define measurement units used across products</div>
          </div>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingUnit(null);
            setShowModal(true);
          }}
        >
          Add Unit
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-[14px] grid grid-cols-2 gap-2 sm:grid-cols-4 md:mb-5 md:gap-3">
        {[
          { label: 'Total Units', value: units.length, icon: Ruler, color: COLORS.primary },
          { label: 'Active', value: activeCount, icon: CheckCircle, color: COLORS.success },
          { label: 'Inactive', value: inactiveCount, icon: Clock, color: COLORS.warning },
          {
            label: 'Types',
            value: typeGroups.filter((t) => t.count > 0).length + '/' + UOM_TYPES.length,
            icon: Layers,
            color: COLORS.accent,
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
            placeholder="Search units..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <TabButton
              key={s}
              active={filterStatus === s}
              variant="filter"
              onClick={() => setFilterStatus(s)}
              className="capitalize"
            >
              {s}
            </TabButton>
          ))}
        </div>
        <div className="flex gap-1">
          {UOM_TYPES.map((t) => {
            const sel = filterType === t;
            return (
              <TabButton
                key={t}
                active={sel}
                variant="filter"
                onClick={() => setFilterType(sel ? 'all' : t)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px]"
              >
                <span className="text-xs">{UOM_ICONS[t]}</span> {t}
              </TabButton>
            );
          })}
        </div>
      </div>

      {/* Units Table (desktop) / Cards (mobile) */}
      {!mobile ? (
        <>
          <Card className="overflow-hidden p-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-border border-b-[1.5px]">
                  {['Unit Name', 'Abbr.', 'Type', 'Products', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-text-dim px-4 py-3 text-left text-[11px] font-bold tracking-[0.8px] uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginate(filtered, tblPage, 10).items.map((unit) => {
                  const prodCount = getProductCount(unit.abbreviation);
                  return (
                    <tr key={unit.id} className="hover:bg-surface-alt border-border/[0.03] border-b">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{UOM_ICONS[unit.type]}</span>
                          <div>
                            <div className="text-text text-[13px] font-semibold">{unit.name}</div>
                            <div className="text-text-dim text-[11px]">{unit.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-primary bg-primary-bg rounded-md px-2.5 py-[3px] font-mono text-[13px] font-bold">
                          {unit.abbreviation}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color="neutral">{unit.type}</Badge>
                      </td>
                      <td className="text-text px-4 py-3 font-mono text-[13px] font-semibold">{prodCount}</td>
                      <td className="px-4 py-3">
                        <Badge color={unit.status === 'active' ? 'success' : 'warning'}>{unit.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => {
                              setEditingUnit(unit);
                              setShowModal(true);
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={unit.status === 'active' ? Clock : CheckCircle}
                            onClick={() => toggleStatus(unit.id)}
                            className={unit.status === 'active' ? 'text-warning' : 'text-success'}
                          />
                          {prodCount === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => handleDelete(unit.id)}
                              className="text-danger"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-text-dim p-10 text-center">
                <Ruler size={32} className="text-border mb-2" />
                <div className="text-sm font-semibold">{search ? `No units match "${search}"` : 'No units found'}</div>
              </div>
            )}
          </Card>
          <Paginator {...paginate(filtered, tblPage, 10)} perPage={10} onPage={(v: number) => setTblPage(v)} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {paginate(filtered, tblPage, 8).items.map((unit) => {
              const prodCount = getProductCount(unit.abbreviation);
              return (
                <Card key={unit.id} className="p-3.5">
                  <div className="mb-2.5 flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{UOM_ICONS[unit.type]}</span>
                      <div>
                        <div className="text-text text-sm font-bold">{unit.name}</div>
                        <div className="text-text-dim text-[11px]">{unit.description}</div>
                      </div>
                    </div>
                    <Badge color={unit.status === 'active' ? 'success' : 'warning'}>{unit.status}</Badge>
                  </div>
                  <div className="mb-3 flex gap-2">
                    <div className="bg-primary-bg rounded-lg px-3 py-1.5">
                      <span className="text-primary font-mono text-[13px] font-bold">{unit.abbreviation}</span>
                    </div>
                    <Badge color="neutral">{unit.type}</Badge>
                    <span className="text-text-muted flex items-center gap-1 text-xs">
                      <Box size={12} /> {prodCount} products
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit}
                      onClick={() => {
                        setEditingUnit(unit);
                        setShowModal(true);
                      }}
                      className="flex-1 justify-center"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={unit.status === 'active' ? Clock : CheckCircle}
                      onClick={() => toggleStatus(unit.id)}
                      className={unit.status === 'active' ? 'text-warning' : 'text-success'}
                    />
                    {prodCount === 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => handleDelete(unit.id)}
                        className="text-danger"
                      />
                    )}
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-text-dim p-10 text-center">
                <Ruler size={32} className="text-border mb-2" />
                <div className="text-sm font-semibold">{search ? `No units match "${search}"` : 'No units found'}</div>
              </div>
            )}
          </div>
          <Paginator {...paginate(filtered, tblPage, 8)} perPage={8} onPage={(v: number) => setTblPage(v)} />
        </>
      )}

      {showModal && <UnitModal />}
    </div>
  );
};
