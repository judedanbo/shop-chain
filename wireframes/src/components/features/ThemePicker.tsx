import { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '@/context';
import type { ThemeId } from '@/types';

interface ThemePickerProps {
  collapsed?: boolean;
}

export function ThemePicker({ collapsed }: ThemePickerProps) {
  const [open, setOpen] = useState(false);
  const { theme: currentTheme, setTheme, themes, colors } = useTheme();
  const themeList = Object.values(themes);
  const current = themes[currentTheme];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={clsx(
          'text-text-muted hover:bg-surface-alt flex w-full items-center gap-2 rounded-lg text-xs font-medium transition-all duration-200',
          open && 'bg-surface-alt',
          collapsed ? 'justify-center px-2 py-2.5' : 'justify-start px-3 py-2',
        )}
        title={collapsed ? `Theme: ${current.name}` : undefined}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-[3px]">
            {current.preview.map((c, i) => (
              <div
                key={i}
                className="size-2.5 rounded-full"
                style={{
                  background: c,
                  border: `1.5px solid ${colors.borderLight}`,
                  boxShadow: `0 0 0 1px ${c}40`,
                }}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex shrink-0 gap-0.5">
              {current.preview.map((c, i) => (
                <div
                  key={i}
                  className="h-3.5 w-1.5 rounded-sm"
                  style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>
            <span>{current.name}</span>
            <Palette size={13} className="ml-auto opacity-50" />
          </>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} aria-hidden="true" className="z-popover-backdrop fixed inset-0" />
          <div
            className="bg-surface border-border z-popover absolute w-[260px] animate-[modalIn_0.2s_ease] overflow-hidden rounded-[14px] border shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
            style={{
              bottom: collapsed ? 0 : '100%',
              left: collapsed ? '100%' : 0,
              marginBottom: collapsed ? 0 : 6,
              marginLeft: collapsed ? 6 : 0,
            }}
          >
            <div className="border-border border-b px-4 pt-3.5 pb-2.5">
              <div className="text-text text-[13px] font-bold">Appearance</div>
              <div className="text-text-dim mt-0.5 text-[11px]">Choose your preferred theme</div>
            </div>
            <div className="flex flex-col gap-0.5 px-2 pt-2 pb-2.5">
              {themeList.map((t) => {
                const active = currentTheme === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id as ThemeId);
                      setOpen(false);
                    }}
                    className={clsx(
                      'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-all duration-150',
                      active ? 'bg-primary-bg border-primary/[0.25]' : 'hover:bg-surface-alt border-transparent',
                    )}
                  >
                    <div
                      className="flex gap-[3px] rounded-md p-1"
                      style={{ background: t.bg, border: `1px solid ${t.border}` }}
                    >
                      {t.preview.map((c, i) => (
                        <div
                          key={i}
                          className="size-2.5 rounded-full"
                          style={{ background: c, boxShadow: `0 0 0 1px ${c}40` }}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div
                        className="text-xs"
                        style={{
                          fontWeight: active ? 600 : 500,
                          color: active ? colors.primaryLight : colors.text,
                        }}
                      >
                        {t.name}
                      </div>
                      <div className="text-text-dim text-[10px]">{t.isDark ? 'Dark' : 'Light'}</div>
                    </div>
                    {active && <Check size={14} style={{ color: colors.primary }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
