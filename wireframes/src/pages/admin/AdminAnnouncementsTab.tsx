import { useState } from 'react';
import { Bell, Plus, Edit3, Trash2, Eye, EyeOff, X } from 'lucide-react';
import type {
  AdminAnnouncement,
  AnnouncementTarget,
  AnnouncementPriority,
  AnnouncementStatus,
} from '@/types/admin.types';
import type { AdminThemeColors } from '@/constants/adminThemes';

interface AdminAnnouncementsTabProps {
  C: AdminThemeColors;
}

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all: 'All Users',
  free: 'Free',
  basic: 'Basic',
  max: 'Max',
};

const PRIORITY_COLOR = (C: AdminThemeColors, p: AnnouncementPriority) =>
  p === 'critical' ? C.danger : p === 'warning' ? C.warning : C.primary;

export function AdminAnnouncementsTab({ C }: AdminAnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([
    {
      id: 'ann-1',
      title: 'Scheduled Maintenance',
      body: 'ShopChain will undergo brief maintenance on Feb 20, 2026 at 2:00 AM GMT. Expected downtime: ~30 minutes.',
      target: 'all',
      priority: 'warning',
      status: 'active',
      created: '2026-02-12',
    },
    {
      id: 'ann-2',
      title: 'New Feature: Branch Management',
      body: 'Multi-branch management is now live! Manage inventory across locations from one dashboard.',
      target: 'all',
      priority: 'info',
      status: 'active',
      created: '2026-02-10',
    },
    {
      id: 'ann-3',
      title: 'Max Plan — 50% Off This Month',
      body: 'Upgrade to Max plan at half price. Limited-time offer for Basic plan users.',
      target: 'basic',
      priority: 'info',
      status: 'draft',
      created: '2026-02-08',
    },
    {
      id: 'ann-4',
      title: 'Data Export Now Available',
      body: 'You can now export your inventory, sales, and customer data in CSV and PDF formats.',
      target: 'all',
      priority: 'info',
      status: 'active',
      created: '2026-01-28',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<AdminAnnouncement | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formTarget, setFormTarget] = useState<AnnouncementTarget>('all');
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>('info');

  const openCreate = () => {
    setEditingAnn(null);
    setFormTitle('');
    setFormBody('');
    setFormTarget('all');
    setFormPriority('info');
    setShowCreateModal(true);
  };

  const openEdit = (a: AdminAnnouncement) => {
    setEditingAnn(a);
    setFormTitle(a.title);
    setFormBody(a.body);
    setFormTarget(a.target);
    setFormPriority(a.priority);
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingAnn(null);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    if (editingAnn) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingAnn.id
            ? { ...a, title: formTitle, body: formBody, target: formTarget, priority: formPriority }
            : a,
        ),
      );
    } else {
      const newAnn: AdminAnnouncement = {
        id: `ann-${Date.now()}`,
        title: formTitle,
        body: formBody,
        target: formTarget,
        priority: formPriority,
        status: 'draft',
        created: new Date().toISOString().slice(0, 10),
      };
      setAnnouncements((prev) => [newAnn, ...prev]);
    }
    closeModal();
  };

  const toggleStatus = (id: string) =>
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: (a.status === 'active' ? 'draft' : 'active') as AnnouncementStatus } : a,
      ),
    );

  const deleteAnn = (id: string) => setAnnouncements((prev) => prev.filter((a) => a.id !== id));

  const inputCls = 'w-full rounded-[10px] text-[13px] font-[inherit] outline-none box-border';
  const labelCls = 'text-[11px] font-bold uppercase tracking-[0.5px] mb-1 block';

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-text m-0 text-lg font-extrabold sm:text-xl">Announcements</h2>
        <button
          type="button"
          onClick={openCreate}
          className="bg-primary-bg text-primary flex items-center gap-1.5 rounded-[10px] border-none px-4 py-2 text-[13px] font-bold"
        >
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <div key={a.id} className="bg-surface border-border rounded-[14px] border-[1.5px] p-3.5 sm:p-[18px]">
            <div className="flex items-start gap-3">
              <Bell size={18} className="mt-0.5 shrink-0" style={{ color: PRIORITY_COLOR(C, a.priority) }} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-text text-sm font-bold">{a.title}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: PRIORITY_COLOR(C, a.priority) + '20',
                      color: PRIORITY_COLOR(C, a.priority),
                    }}
                  >
                    {a.priority}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: a.status === 'active' ? C.success + '20' : C.textDim + '20',
                      color: a.status === 'active' ? C.success : C.textDim,
                    }}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-text-muted mt-1 mb-2 text-xs leading-6">{a.body}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary-bg text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold">
                    {TARGET_LABELS[a.target]}
                  </span>
                  <span className="text-text-dim text-[11px]">{a.created}</span>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="border-border mt-3 flex gap-1.5 border-t pt-2.5">
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="bg-surface-alt text-text-muted flex items-center gap-1 rounded-lg border-none px-3 py-1.5 text-xs font-semibold"
              >
                <Edit3 size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={() => toggleStatus(a.id)}
                className="bg-surface-alt text-text-muted flex items-center gap-1 rounded-lg border-none px-3 py-1.5 text-xs font-semibold"
              >
                {a.status === 'active' ? (
                  <>
                    <EyeOff size={13} /> Unpublish
                  </>
                ) : (
                  <>
                    <Eye size={13} /> Publish
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => deleteAnn(a.id)}
                className="bg-danger-bg text-danger flex items-center gap-1 rounded-lg border-none px-3 py-1.5 text-xs font-semibold"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div
          className="z-modal-backdrop fixed inset-0 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-surface border-border relative w-full max-w-[500px] rounded-[18px] border-[1.5px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="text-text-muted absolute top-4 right-4 border-none bg-none p-0"
            >
              <X size={18} />
            </button>

            <h3 className="text-text mt-0 mr-0 mb-5 ml-0 text-[17px] font-extrabold">
              {editingAnn ? 'Edit Announcement' : 'New Announcement'}
            </h3>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className={`${labelCls} text-text-muted`}>Title</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={`${inputCls} border-border bg-surface-alt text-text border-[1.5px] px-3.5 py-2.5`}
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className={`${labelCls} text-text-muted`}>Body</label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={4}
                  className={`${inputCls} border-border bg-surface-alt text-text resize-y border-[1.5px] px-3.5 py-2.5`}
                  placeholder="Announcement body..."
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`${labelCls} text-text-muted`}>Target</label>
                  <select
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value as AnnouncementTarget)}
                    className={`${inputCls} border-border bg-surface-alt text-text border-[1.5px] px-3.5 py-2.5`}
                  >
                    <option value="all">All Users</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="max">Max</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className={`${labelCls} text-text-muted`}>Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as AnnouncementPriority)}
                    className={`${inputCls} border-border bg-surface-alt text-text border-[1.5px] px-3.5 py-2.5`}
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-[22px] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="bg-surface-alt text-text-muted border-border rounded-[10px] border-[1.5px] px-5 py-[9px] text-[13px] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-primary rounded-[10px] border-none px-5 py-[9px] text-[13px] font-bold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
