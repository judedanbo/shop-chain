import React, { useState, useEffect } from 'react';
import { ScanLine, X, CheckCircle, RotateCcw, Plus, AlertTriangle, Keyboard, Camera, Zap, QrCode } from 'lucide-react';
import clsx from 'clsx';
import { useColors } from '@/context';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Product } from '@/types';

const DEMO_BARCODES = [
  { code: '5901234123457', product: 'Premium Basmati Rice' },
  { code: '5901234123458', product: 'Organic Palm Oil (5L)' },
  { code: '5901234123459', product: 'Nestle Milo (400g)' },
  { code: '5901234123460', product: 'Peak Milk Powder (900g)' },
  { code: '5901234123461', product: 'Golden Penny Spaghetti' },
  { code: '5901234123462', product: 'Titus Sardines (125g)' },
  { code: '5901234123463', product: 'Voltic Water (1.5L)' },
  { code: '5901234123464', product: 'KeyRound Soap (Pack of 6)' },
];

export interface ScanResult {
  code: string;
  product?: Product;
  notFound?: boolean;
}

interface RecentScan {
  code: string;
  product?: string;
  time: string;
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: Product | string | ScanResult) => void;
  products?: Product[];
  mode?: 'search' | 'barcode';
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  products = [],
  mode = 'search',
}) => {
  const COLORS = useColors();
  const [scanPhase, setScanPhase] = useState<'scanning' | 'success' | 'not_found' | 'manual'>('scanning');
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [scanLinePos, setScanLinePos] = useState(0);

  useEffect(() => {
    if (!isOpen || scanPhase !== 'scanning') return;
    const interval = setInterval(() => {
      setScanLinePos((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 20);
    return () => clearInterval(interval);
  }, [isOpen, scanPhase]);

  useEffect(() => {
    if (!isOpen || scanPhase !== 'scanning') return;
    const timeout = setTimeout(
      () => {
        const demo = DEMO_BARCODES[Math.floor(Math.random() * DEMO_BARCODES.length)];
        if (demo) handleCodeDetected(demo.code);
      },
      3500 + Math.random() * 2000,
    );
    return () => clearTimeout(timeout);
  }, [isOpen, scanPhase]);

  const handleCodeDetected = (code: string) => {
    if (mode === 'barcode') {
      setScanResult({ code });
      setScanPhase('success');
      setRecentScans((prev) => [{ code, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
      return;
    }
    const found = products.find((p) => p.barcode === code);
    if (found) {
      setScanResult({ code, product: found });
      setScanPhase('success');
      setRecentScans((prev) =>
        [{ code, product: found.name, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5),
      );
    } else {
      setScanResult({ code });
      setScanPhase('not_found');
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) handleCodeDetected(manualCode.trim());
  };

  const handleConfirm = () => {
    if (scanResult) {
      onScan(mode === 'barcode' ? scanResult.code : scanResult.product || scanResult.code);
    }
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setScanPhase('scanning');
    setScanResult(null);
    setManualCode('');
    setScanLinePos(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="z-modal-scanner-backdrop fixed inset-0 bg-black/70 backdrop-blur-[4px]"
        onClick={handleClose}
      />
      <div
        className="bg-surface z-modal-scanner fixed flex max-h-screen w-full flex-col overflow-hidden rounded-none sm:max-h-[92vh] sm:w-[94%] sm:rounded-[20px] md:w-[440px]"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          animation: 'modalIn 0.3s ease',
        }}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }}
            >
              <ScanLine size={18} className="text-white" />
            </div>
            <div>
              <div className="text-text text-[15px] font-bold">
                {mode === 'barcode' ? 'Scan Barcode' : 'Scan Product'}
              </div>
              <div className="text-text-dim text-[11px]">
                {mode === 'barcode' ? 'Point camera at barcode' : 'Scan to find or add to cart'}
              </div>
            </div>
          </div>
          <div
            onClick={handleClose}
            className="bg-surface-alt flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
          >
            <X size={16} className="text-text-muted" />
          </div>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#0a0a0a]">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%)',
            }}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="absolute h-0.5 w-0.5 rounded-full"
                style={{
                  background: `rgba(255,255,255,${0.03 + Math.random() * 0.06})`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-square w-[68%]">
              {(
                [
                  { top: 0, left: 0, borderTop: '3px solid', borderLeft: '3px solid' },
                  { top: 0, right: 0, borderTop: '3px solid', borderRight: '3px solid' },
                  { bottom: 0, left: 0, borderBottom: '3px solid', borderLeft: '3px solid' },
                  { bottom: 0, right: 0, borderBottom: '3px solid', borderRight: '3px solid' },
                ] as const
              ).map((s, i) => (
                <div
                  key={i}
                  className="absolute h-7 w-7 rounded"
                  style={
                    {
                      ...s,
                      borderColor:
                        scanPhase === 'success' ? '#22C55E' : scanPhase === 'not_found' ? '#EF4444' : COLORS.primary,
                      transition: 'border-color 0.3s',
                    } as React.CSSProperties
                  }
                />
              ))}

              {scanPhase === 'scanning' && (
                <div
                  className="absolute right-2 left-2"
                  style={{
                    top: `${scanLinePos}%`,
                    height: 2,
                    background: `linear-gradient(90deg, transparent, ${COLORS.primary}, transparent)`,
                    boxShadow: `0 0 12px ${COLORS.primary}80`,
                    transition: scanLinePos === 0 ? 'none' : 'top 0.02s linear',
                  }}
                />
              )}

              {scanPhase === 'success' && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-[4px] bg-[rgba(34,197,94,0.15)]"
                  style={{ animation: 'modalIn 0.3s ease' }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#22C55E] bg-[rgba(34,197,94,0.2)]">
                    <CheckCircle size={28} className="text-[#22C55E]" />
                  </div>
                </div>
              )}

              {scanPhase === 'not_found' && (
                <div
                  className="absolute inset-0 flex items-center justify-center rounded-[4px] bg-[rgba(239,68,68,0.15)]"
                  style={{ animation: 'modalIn 0.3s ease' }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#EF4444] bg-[rgba(239,68,68,0.2)]">
                    <X size={28} className="text-[#EF4444]" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            onClick={() => setTorchOn(!torchOn)}
            className="absolute top-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] backdrop-blur-[8px]"
            style={{
              background: torchOn ? 'rgba(250,204,21,0.25)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${torchOn ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.15)'}`,
            }}
          >
            <Zap
              size={16}
              style={{ color: torchOn ? '#FACC15' : 'rgba(255,255,255,0.6)', fill: torchOn ? '#FACC15' : 'none' }}
            />
          </div>

          <div
            className="absolute bottom-3 left-1/2 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1 text-[10px] text-white/60 backdrop-blur-[8px]"
            style={{ transform: 'translateX(-50%)' }}
          >
            <Camera size={12} />{' '}
            {scanPhase === 'scanning'
              ? 'Align barcode within frame'
              : scanPhase === 'success'
                ? 'Code detected!'
                : 'Barcode not recognised'}
          </div>

          {torchOn && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(250,250,200,0.08) 0%, transparent 60%)',
              }}
            />
          )}
        </div>

        {/* Result Area */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5">
          {scanPhase === 'scanning' && (
            <div className="py-2 text-center">
              <div className="mb-3 flex items-center justify-center gap-2">
                <div
                  className="bg-primary h-2 w-2 rounded-full"
                  style={{ animation: 'modalIn 1s ease infinite alternate' }}
                />
                <span className="text-text-muted text-[13px] font-semibold">Scanning for barcodes...</span>
              </div>
              <div
                onClick={() => setScanPhase('manual')}
                className="border-border text-text-muted inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-4 py-2 text-xs font-semibold transition-all duration-150"
              >
                <Keyboard size={14} /> Enter code manually
              </div>
            </div>
          )}

          {scanPhase === 'manual' && (
            <div className="py-1">
              <label className="text-text-dim mb-1.5 block text-[11px] font-bold tracking-[1px] uppercase">
                Enter Barcode Manually
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                  placeholder="e.g. 5901234123457"
                  autoFocus
                  className="bg-surface-alt text-text border-border flex-1 rounded-[10px] border-[1.5px] px-3.5 py-2.5 font-mono text-[15px] tracking-[1.5px] outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                  className={clsx(
                    'rounded-[10px] border-none px-[18px] py-2.5 font-[inherit] text-[13px] font-bold',
                    manualCode.trim() ? 'cursor-pointer text-white' : 'text-text-dim bg-surface-alt cursor-not-allowed',
                  )}
                  style={
                    manualCode.trim()
                      ? { background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})` }
                      : undefined
                  }
                >
                  Lookup
                </button>
              </div>
              <div
                onClick={() => {
                  setScanPhase('scanning');
                  setManualCode('');
                }}
                className="text-primary mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold"
              >
                <Camera size={12} /> Back to camera
              </div>
            </div>
          )}

          {scanPhase === 'success' && mode === 'search' && scanResult?.product && (
            <div style={{ animation: 'modalIn 0.3s ease' }}>
              <div className="mb-2.5 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-success" />
                <span className="text-success text-xs font-bold">Product Found</span>
                <span className="text-text-dim ml-auto font-mono text-[11px]">{scanResult.code}</span>
              </div>
              <div className="bg-success-bg border-success/[0.15] mb-3 flex items-center gap-3 rounded-xl border p-3.5">
                <div className="bg-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-2xl">
                  {scanResult.product.image}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-text text-sm font-bold">{scanResult.product.name}</div>
                  <div className="text-text-dim text-[11px]">
                    {scanResult.product.category} · {scanResult.product.id}
                  </div>
                  <div className="mt-1 flex gap-2">
                    <span className="text-primary font-mono text-[13px] font-bold">
                      GH&#x20B5; {scanResult.product.price.toFixed(2)}
                    </span>
                    <Badge color={scanResult.product.stock > 0 ? 'success' : 'danger'}>
                      {scanResult.product.stock > 0 ? `${scanResult.product.stock} in stock` : 'Out of stock'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" icon={CheckCircle} onClick={handleConfirm} className="flex-1 justify-center">
                  Select Product
                </Button>
                <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
                  Scan Again
                </Button>
              </div>
            </div>
          )}

          {scanPhase === 'success' && mode === 'barcode' && (
            <div style={{ animation: 'modalIn 0.3s ease' }}>
              <div className="mb-2.5 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-success" />
                <span className="text-success text-xs font-bold">Barcode Captured</span>
              </div>
              <div className="bg-success-bg border-success/[0.15] mb-3 rounded-xl border p-4 text-center">
                <div className="form-label mb-1.5 font-semibold">Scanned Code</div>
                <div className="text-text font-mono text-[22px] font-bold tracking-[2px]">{scanResult?.code}</div>
                <div className="mt-2.5 flex justify-center gap-px">
                  {scanResult?.code.split('').map((c, i) => (
                    <div
                      key={i}
                      className="h-8 opacity-70"
                      style={{
                        width: parseInt(c) % 2 === 0 ? 2 : 1,
                        background: COLORS.text,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" icon={CheckCircle} onClick={handleConfirm} className="flex-1 justify-center">
                  Use This Code
                </Button>
                <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
                  Scan Again
                </Button>
              </div>
            </div>
          )}

          {scanPhase === 'not_found' && (
            <div style={{ animation: 'modalIn 0.3s ease' }}>
              <div className="mb-2.5 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-warning" />
                <span className="text-warning text-xs font-bold">Product Not Found</span>
              </div>
              <div className="bg-warning-bg border-warning/[0.15] mb-3 rounded-xl border p-3.5">
                <div className="text-text-muted mb-1 text-xs">No product matches barcode:</div>
                <div className="text-text font-mono text-base font-bold tracking-[1px]">{scanResult?.code}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" icon={RotateCcw} onClick={handleReset} className="flex-1 justify-center">
                  Scan Again
                </Button>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    onScan({ notFound: true, code: scanResult?.code || '' });
                    handleReset();
                    onClose();
                  }}
                  className="flex-1 justify-center"
                >
                  Add New Product
                </Button>
              </div>
            </div>
          )}

          {recentScans.length > 0 && (
            <div className="border-border mt-3.5 border-t pt-3.5">
              <div className="form-label mb-2">Recent Scans</div>
              <div className="flex flex-col gap-1">
                {recentScans.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => handleCodeDetected(s.code)}
                    className="bg-surface-alt flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-[7px] transition-all duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode size={12} className="text-text-dim" />
                      <span className="text-text font-mono text-xs font-semibold">{s.code}</span>
                      {s.product && <span className="text-text-muted text-[11px]">· {s.product}</span>}
                    </div>
                    <span className="text-text-dim text-[10px]">{s.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
