import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavV3 } from '../components/NavV3';
import { FooterV3 } from '../components/FooterV3';
import { useComplex } from '../../hooks/useComplex';
import { useBindingSites } from '../../hooks/useBindingSites';
import { useMutationStructures } from '../../hooks/useMutationStructures';
import { useMutationAnalyze } from '../../hooks/useMutationAnalyze';
import { MutationViewer } from '../../components/mutation/MutationViewer';
import { DockingSectionV3 } from '../components/DockingSectionV3';
import type { Pocket, ProteinViewerHandle, ComparisonData, ScatterDataPoint, Fragment, MutationAnalyzeResult, Conformation, LeaderboardEntry, DockingInfo } from '../../types';

// Lazy-load the heavy Mol* viewer — JS only fetched when first rendered
const ProteinViewerLazy = React.lazy(
  () => import('../../components/complex/viewer/ProteinViewer')
    .then(m => ({ default: m.ProteinViewer })),
);
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

// ── Shared helpers ────────────────────────────────────────────────────────────

type TagVariant = 'who' | 'undrugged' | 'drugged' | 'unreviewed' | 'neutral';
const TAG_STYLES: Record<TagVariant, { bg: string; color: string; border: string }> = {
  who:        { bg: 'rgba(239,68,68,0.08)',   color: '#DC2626', border: 'rgba(239,68,68,0.22)'  },
  undrugged:  { bg: 'rgba(245,158,11,0.09)',  color: '#B45309', border: 'rgba(245,158,11,0.25)' },
  drugged:    { bg: 'rgba(16,185,129,0.08)',  color: '#047857', border: 'rgba(16,185,129,0.22)' },
  unreviewed: { bg: 'rgba(251,191,36,0.10)',  color: '#92400E', border: 'rgba(251,191,36,0.28)' },
  neutral:    { bg: 'rgba(11,15,20,0.04)',    color: '#7A8580', border: 'rgba(11,15,20,0.10)'   },
};
function Tag({ variant, children }: { variant: TagVariant; children: React.ReactNode }) {
  const s = TAG_STYLES[variant];
  return (
    <span
      className="text-[10.5px] tracking-[0.05em] uppercase px-[10px] py-[3px] rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {children}
    </span>
  );
}

function ScoreBar({ score, max = 1 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const fill = pct >= 65 ? '#047857' : pct >= 35 ? '#B45309' : '#D1D9D5';
  const label = pct >= 65 ? '#047857' : pct >= 35 ? '#B45309' : '#B8C2BD';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(11,15,20,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 1.5)}%`, background: fill }} />
      </div>
      <span className="text-[11px] w-[40px] text-right shrink-0" style={{ color: label }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Pocket color palette (cycles by index) ────────────────────────────────────

const POCKET_PALETTE = [
  { bg: '#ECFDF5', activeBg: '#D1FAE5', border: 'rgba(16,185,129,0.30)',  activeBorder: 'rgba(16,185,129,0.55)',  accent: '#10b981', divider: 'rgba(16,185,129,0.16)' },
  { bg: '#EFF6FF', activeBg: '#DBEAFE', border: 'rgba(59,130,246,0.30)',  activeBorder: 'rgba(59,130,246,0.55)',  accent: '#3b82f6', divider: 'rgba(59,130,246,0.16)' },
  { bg: '#FEFCE8', activeBg: '#FEF08A', border: 'rgba(234,179,8,0.35)',   activeBorder: 'rgba(234,179,8,0.60)',   accent: '#ca8a04', divider: 'rgba(234,179,8,0.18)'  },
  { bg: '#F5F3FF', activeBg: '#EDE9FE', border: 'rgba(139,92,246,0.30)',  activeBorder: 'rgba(139,92,246,0.55)',  accent: '#8b5cf6', divider: 'rgba(139,92,246,0.16)' },
  { bg: '#FFF1F2', activeBg: '#FFE4E6', border: 'rgba(244,63,94,0.30)',   activeBorder: 'rgba(244,63,94,0.55)',   accent: '#f43f5e', divider: 'rgba(244,63,94,0.16)'  },
  { bg: '#F0FDFA', activeBg: '#CCFBF1', border: 'rgba(20,184,166,0.30)',  activeBorder: 'rgba(20,184,166,0.55)',  accent: '#0d9488', divider: 'rgba(20,184,166,0.16)' },
] as const;

function pocketColors(index: number, isActive: boolean) {
  const p = POCKET_PALETTE[index % POCKET_PALETTE.length];
  return {
    bg:      isActive ? p.activeBg     : p.bg,
    border:  isActive ? p.activeBorder : p.border,
    accent:  p.accent,
    divider: p.divider,
  };
}

// Shared badge fragments
function PocketBadges({ pocket }: { pocket: Pocket }) {
  return (
    <>
      {pocket.is_interface_pocket && (
        <span className="text-[10px] tracking-[0.05em] uppercase px-[8px] py-[2px] rounded-full font-medium"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#047857', border: '1px solid rgba(16,185,129,0.25)' }}>
          Interface
        </span>
      )}
      {pocket.is_emergent && (
        <span className="text-[10px] tracking-[0.05em] uppercase px-[8px] py-[2px] rounded-full font-medium"
          style={{ background: 'rgba(99,102,241,0.10)', color: '#4338CA', border: '1px solid rgba(99,102,241,0.25)' }}>
          Emergent
        </span>
      )}
      {pocket.is_conserved && (
        <span className="text-[10px] tracking-[0.05em] uppercase px-[8px] py-[2px] rounded-full font-medium"
          style={{ background: 'rgba(245,158,11,0.10)', color: '#B45309', border: '1px solid rgba(245,158,11,0.25)' }}>
          Conserved
        </span>
      )}
    </>
  );
}

// ── Pocket card ───────────────────────────────────────────────────────────────

function PocketCard({
  pocket,
  index,
  isActive,
  onHighlight,
  layout = 'grid',
  isLast = false,
  onStartDocking,
  isDockingActive = false,
}: {
  pocket: Pocket;
  index: number;
  isActive: boolean;
  onHighlight: (indices: number[]) => void;
  layout?: 'grid' | 'list';
  isLast?: boolean;
  onStartDocking?: (pocket: Pocket) => void;
  isDockingActive?: boolean;
}) {
  const score    = pocket.druggability_score ?? 0;
  const scorePct = Math.min(score * 100, 100);
  const colors   = pocketColors(index, isActive);

  const METRICS = [
    { label: 'Volume',      value: (pocket.volume          ?? 0).toFixed(0)  },
    { label: 'Hydrophob.',  value: (pocket.hydrophobicity  ?? 0).toFixed(2)  },
    { label: 'Polarity',    value: (pocket.polarity        ?? 0).toFixed(2)  },
    { label: 'pLDDT',       value: (pocket.avg_plddt       ?? 0).toFixed(1)  },
  ];

  // ── List row ──────────────────────────────────────────────────────────────
  if (layout === 'list') {
    return (
      <div
        className="flex items-center gap-4 py-3 pl-0 pr-4 transition-colors duration-150"
        style={{
          background: colors.bg,
          borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
        }}
      >
        {/* Coloured left accent bar */}
        <div className="w-[4px] self-stretch shrink-0 rounded-r-full" style={{ background: colors.accent }} />

        {/* Pocket # + badges */}
        <div className="flex flex-col gap-[5px] shrink-0 w-[160px]">
          <span className="text-[13px] font-semibold text-[#0B0F14]">Pocket {pocket.pocket_id}</span>
          <div className="flex items-center gap-[5px] flex-wrap">
            <PocketBadges pocket={pocket} />
          </div>
        </div>

        {/* Score bar + % */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(11,15,20,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(scorePct, 1.5)}%`, background: colors.accent }} />
          </div>
          <span className="text-[12px] font-mono font-semibold shrink-0 w-[38px] text-right" style={{ color: colors.accent }}>
            {scorePct.toFixed(0)}%
          </span>
        </div>

        {/* Quick metrics */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          {[
            { label: 'Vol',   value: (pocket.volume         ?? 0).toFixed(0)  },
            { label: 'Hydro', value: (pocket.hydrophobicity ?? 0).toFixed(2) },
            { label: 'pLDDT', value: (pocket.avg_plddt      ?? 0).toFixed(1)  },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-[2px]">
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
                {label}
              </span>
              <span className="text-[12px] font-mono font-medium text-[#0B0F14]">{value}</span>
            </div>
          ))}
        </div>

        {/* Action group */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onHighlight(pocket.residue_indices)}
            className="text-[11px] font-medium tracking-wide px-3 py-[5px] rounded-full transition-colors duration-150"
            style={
              isActive
                ? { background: '#0B0F14', color: 'white', border: '1px solid #0B0F14' }
                : { background: 'transparent', color: '#4A554D', border: '1px solid rgba(11,15,20,0.16)' }
            }
          >
            {isActive ? 'Clear' : 'Highlight'}
          </button>
          {onStartDocking && (
            <button
              onClick={() => onStartDocking(pocket)}
              className="text-[11px] font-semibold tracking-wide px-3 py-[5px] rounded-full transition-colors duration-150"
              style={
                isDockingActive
                  ? { background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }
                  : { background: 'rgba(11,15,20,0.03)', color: '#0B0F14', border: '1px solid rgba(11,15,20,0.10)' }
              }
            >
              {isDockingActive ? '● Docking' : 'Dock'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Grid card ─────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-[16px] overflow-hidden transition-colors duration-150"
      style={{ border: `1px solid ${colors.border}` }}
    >
      {/* ── Coloured header zone ── */}
      <div className="px-5 pt-5 pb-4" style={{ background: colors.bg }}>
        {/* Pocket # and score side by side */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] mb-1" style={{ color: 'rgba(11,15,20,0.45)' }}>
              Pocket
            </p>
            <span className="text-[32px] font-semibold leading-none text-[#0B0F14]">
              {pocket.pocket_id}
            </span>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.08em] mb-1" style={{ color: 'rgba(11,15,20,0.45)' }}>
              Druggability
            </p>
            <span className="text-[32px] font-semibold leading-none" style={{ color: colors.accent }}>
              {scorePct.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Score bar — uses palette accent */}
        <div className="h-[6px] rounded-full overflow-hidden mb-4" style={{ background: 'rgba(11,15,20,0.10)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.max(scorePct, 1.5)}%`, background: colors.accent }}
          />
        </div>

        {/* Badges */}
        <div className="flex items-center gap-[6px] flex-wrap min-h-[20px]">
          <PocketBadges pocket={pocket} />
        </div>
      </div>

      {/* ── White body zone ── */}
      <div className="bg-white" style={{ borderTop: `1px solid ${colors.divider}` }}>
        {/* Metrics row */}
        <div
          className="grid grid-cols-4"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          {METRICS.map(({ label, value }, i) => (
            <div
              key={label}
              className="flex flex-col items-center py-3 px-2 text-center"
              style={{ borderRight: i < 3 ? `1px solid ${colors.divider}` : 'none' }}
            >
              <span className="text-[10px] uppercase tracking-[0.06em] mb-[5px]" style={{ color: 'rgba(11,15,20,0.38)' }}>
                {label}
              </span>
              <span className="text-[13px] font-mono font-semibold text-[#0B0F14]">{value}</span>
            </div>
          ))}
        </div>

        {/* Residues + buttons */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-1 min-w-0">
            {pocket.residue_names?.slice(0, 8).map((r, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-[6px] py-[2px] rounded"
                style={{ background: colors.bg, color: '#4A554D' }}
              >
                {r}
              </span>
            ))}
            {(pocket.residue_names?.length ?? 0) > 8 && (
              <span className="text-[10px] px-[4px] py-[2px]" style={{ color: '#B8C2BD' }}>
                +{pocket.residue_names.length - 8}
              </span>
            )}
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => onHighlight(pocket.residue_indices)}
              className="text-[11px] font-medium tracking-wide px-3 py-[5px] rounded-full transition-colors duration-150"
              style={
                isActive
                  ? { background: '#0B0F14', color: 'white', border: '1px solid #0B0F14' }
                  : { background: 'transparent', color: '#4A554D', border: '1px solid rgba(11,15,20,0.16)' }
              }
            >
              {isActive ? 'Clear' : 'Highlight'}
            </button>
            {onStartDocking && (
              <button
                onClick={() => onStartDocking(pocket)}
                className="text-[11px] font-semibold tracking-wide px-3 py-[5px] rounded-full transition-colors duration-150"
                style={
                  isDockingActive
                    ? { background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }
                    : { background: 'rgba(11,15,20,0.03)', color: '#0B0F14', border: '1px solid rgba(11,15,20,0.10)' }
                }
              >
                {isDockingActive ? '● Active' : 'Dock'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Scatter chart (v3 light theme) ────────────────────────────────────────────

const CHART_MARGIN = { top: 10, right: 30, bottom: 32, left: 50 };
const ZOOM_FACTOR  = 1.3;
const MIN_ZOOM     = 0.25;
const MAX_ZOOM     = 8;

interface Viewport { xMin: number; xMax: number; yMin: number; yMax: number; }

function ScatterChartV3({ data }: { data: ScatterDataPoint[] }) {
  const fullExtent = useMemo<Viewport>(() => {
    if (!data.length) return { xMin: -5, xMax: 5, yMin: 0, yMax: 1 };
    const xs = data.map(d => d.avg_delta);
    const ys = data.map(d => d.druggability_score);
    return {
      xMin: Math.min(-5, Math.min(...xs) - 1),
      xMax: Math.max(5,  Math.max(...xs) + 1),
      yMin: Math.min(...ys) - 0.05,
      yMax: Math.max(...ys) + 0.05,
    };
  }, [data]);

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const vp = viewport ?? fullExtent;

  const zoomLevel = useMemo(() => {
    const fw = fullExtent.xMax - fullExtent.xMin;
    const cw = vp.xMax - vp.xMin;
    return cw > 0 ? fw / cw : 1;
  }, [fullExtent, vp]);

  const chartRef = useRef<HTMLDivElement>(null);
  const dragRef  = useRef<{ startX: number; startY: number; vpStart: Viewport } | null>(null);

  const pixelToData = useCallback((px: number, py: number, rect: DOMRect) => {
    const pw = rect.width  - CHART_MARGIN.left - CHART_MARGIN.right;
    const ph = rect.height - CHART_MARGIN.top  - CHART_MARGIN.bottom;
    const fx = Math.max(0, Math.min(1, (px - CHART_MARGIN.left) / pw));
    const fy = Math.max(0, Math.min(1, 1 - (py - CHART_MARGIN.top) / ph));
    return { dataX: vp.xMin + fx * (vp.xMax - vp.xMin), dataY: vp.yMin + fy * (vp.yMax - vp.yMin) };
  }, [vp]);

  React.useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const { dataX, dataY } = pixelToData(e.clientX - rect.left, e.clientY - rect.top, rect);
      const factor = e.deltaY < 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
      const nxMin = dataX - (dataX - vp.xMin) * factor;
      const nxMax = dataX + (vp.xMax - dataX) * factor;
      const nyMin = dataY - (dataY - vp.yMin) * factor;
      const nyMax = dataY + (vp.yMax - dataY) * factor;
      const nz = (fullExtent.xMax - fullExtent.xMin) / (nxMax - nxMin);
      if (nz < MIN_ZOOM || nz > MAX_ZOOM) return;
      setViewport({ xMin: nxMin, xMax: nxMax, yMin: nyMin, yMax: nyMax });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [vp, fullExtent, pixelToData]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, vpStart: { ...vp } };
    document.body.style.cursor = 'grabbing';
    const onMove = (me: MouseEvent) => {
      const dr = dragRef.current;
      if (!dr) return;
      const rect = chartRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pw = rect.width  - CHART_MARGIN.left - CHART_MARGIN.right;
      const ph = rect.height - CHART_MARGIN.top  - CHART_MARGIN.bottom;
      const dx = -((me.clientX - dr.startX) / pw) * (dr.vpStart.xMax - dr.vpStart.xMin);
      const dy =  ((me.clientY - dr.startY) / ph) * (dr.vpStart.yMax - dr.vpStart.yMin);
      setViewport({ xMin: dr.vpStart.xMin + dx, xMax: dr.vpStart.xMax + dx, yMin: dr.vpStart.yMin + dy, yMax: dr.vpStart.yMax + dy });
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [vp]);

  const zoom = (factor: number) => {
    const mx = (vp.xMin + vp.xMax) / 2, my = (vp.yMin + vp.yMax) / 2;
    setViewport({ xMin: mx - (mx - vp.xMin) * factor, xMax: mx + (vp.xMax - mx) * factor, yMin: my - (my - vp.yMin) * factor, yMax: my + (vp.yMax - my) * factor });
  };

  return (
    <div className="rounded-[16px] overflow-hidden p-5 flex flex-col gap-4"
      style={{ border: '1px solid rgba(11,15,20,0.08)', background: '#FAFBFA' }}>

      <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '12px' }}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.07em] m-0 mb-[3px]" style={{ color: 'rgba(11,15,20,0.38)' }}>
            Scatter chart
          </p>
          <h4 className="text-[14px] font-medium text-[#0B0F14] m-0">Stabilization vs. Druggability</h4>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => zoom(ZOOM_FACTOR)} disabled={zoomLevel <= MIN_ZOOM}
            className="w-7 h-7 flex items-center justify-center rounded text-[16px] font-medium transition-opacity disabled:opacity-30"
            style={{ border: '1px solid rgba(11,15,20,0.12)', background: 'white', color: '#4A554D' }}>−</button>
          <button onClick={() => setViewport(null)}
            className="h-7 px-2 flex items-center justify-center rounded text-[10px] font-mono uppercase tracking-wider"
            style={{ border: '1px solid rgba(11,15,20,0.12)', background: 'white', color: '#7A8580' }}>
            {!viewport ? '1.000×' : `${zoomLevel.toFixed(3)}×`}
          </button>
          <button onClick={() => zoom(1 / ZOOM_FACTOR)} disabled={zoomLevel >= MAX_ZOOM}
            className="w-7 h-7 flex items-center justify-center rounded text-[16px] font-medium transition-opacity disabled:opacity-30"
            style={{ border: '1px solid rgba(11,15,20,0.12)', background: 'white', color: '#4A554D' }}>+</button>
        </div>
      </div>

      <div ref={chartRef} className="h-[240px] w-full select-none relative"
        style={{ cursor: 'grab' }} onMouseDown={handleMouseDown}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(11,15,20,0.08)" />
            <XAxis type="number" dataKey="avg_delta" name="Δ pLDDT"
              domain={[vp.xMin, vp.xMax]} allowDataOverflow
              stroke="rgba(11,15,20,0.15)"
              tick={{ fill: '#7A8580', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v: number) => v.toFixed(1)}
              label={{ value: 'Disorder Δ (avg_delta)', position: 'insideBottom', offset: -16, fill: '#7A8580', fontSize: 10 }}
            />
            <YAxis type="number" dataKey="druggability_score" name="Druggability"
              domain={[vp.yMin, vp.yMax]} allowDataOverflow
              stroke="rgba(11,15,20,0.15)"
              tick={{ fill: '#7A8580', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(v: number) => v.toFixed(2)}
              label={{ value: 'Druggability Score', angle: -90, position: 'insideLeft', offset: 12, fill: '#7A8580', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'rgba(11,15,20,0.2)' }}
              contentStyle={{ background: 'white', border: '1px solid rgba(11,15,20,0.10)', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              itemStyle={{ color: '#4A554D' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: any, name: any) => [Number(value).toFixed(3), name]}
            />
            <Scatter name="Pockets"
              data={[...data].sort((a, b) => a.avg_delta - b.avg_delta)}
              line={{ stroke: 'rgba(11,15,20,0.12)', strokeWidth: 1.5, strokeDasharray: '4 4' }}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.avg_delta >= 5.0 ? '#10b981' : '#94a3b8'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {data.every(d => Math.abs(d.avg_delta) < 0.001) && (
          <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none">
            <span className="px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(11,15,20,0.1)', color: '#7A8580' }}>
              Disorder Delta data not available
            </span>
          </div>
        )}
      </div>

      {viewport && (
        <p className="text-[10px] font-mono text-center m-0" style={{ color: 'rgba(11,15,20,0.35)' }}>
          Scroll to zoom · Drag to pan · Click zoom label to reset
        </p>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {[
          { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Stabilised (Δ ≥ 5.0)' },
          { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Other pockets' },
        ].map(({ color, bg, label }) => (
          <div key={label} className="flex items-center gap-[6px]">
            <div className="w-[8px] h-[8px] rounded-full" style={{ background: color, boxShadow: `0 0 0 3px ${bg}` }} />
            <span className="text-[10px]" style={{ color: 'rgba(11,15,20,0.45)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fragment list (v3) ────────────────────────────────────────────────────────

function FragmentListV3({ fragments }: { fragments: Fragment[] | undefined }) {
  if (!fragments?.length) {
    return (
      <p className="text-[13px] text-center py-4 m-0" style={{ color: '#7A8580' }}>No fragments available.</p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {fragments.map((f, i) => (
        <div key={f.chembl_id ?? i}
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-[10px]"
          style={{ background: 'rgba(11,15,20,0.03)', border: '1px solid rgba(11,15,20,0.07)' }}>
          <div className="flex flex-col gap-[3px] min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`https://www.ebi.ac.uk/chembl/compound_report_card/${f.chembl_id}/`}
                target="_blank" rel="noopener noreferrer"
                className="text-[12px] font-mono font-medium no-underline transition-opacity hover:opacity-60"
                style={{ color: '#0B0F14' }}>
                {f.chembl_id}
              </a>
              {f.name && (
                <span className="text-[11px] truncate max-w-[140px]" style={{ color: '#7A8580' }}>{f.name}</span>
              )}
            </div>
            {f.smiles && (
              <span className="text-[10px] font-mono truncate max-w-[220px]" style={{ color: '#B8C2BD' }}>
                {f.smiles}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {(f.mol_weight ?? f.mw) != null && (
              <div className="flex flex-col items-center gap-[2px]">
                <span className="text-[9px] uppercase tracking-[0.06em]" style={{ color: 'rgba(11,15,20,0.35)' }}>MW</span>
                <span className="text-[11px] font-mono text-[#0B0F14]">{(f.mol_weight ?? f.mw)!.toFixed(1)}</span>
              </div>
            )}
            {f.logp != null && (
              <div className="flex flex-col items-center gap-[2px]">
                <span className="text-[9px] uppercase tracking-[0.06em]" style={{ color: 'rgba(11,15,20,0.35)' }}>LogP</span>
                <span className="text-[11px] font-mono text-[#0B0F14]">{f.logp.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Comparison Analysis (v3) ──────────────────────────────────────────────────

function ComparisonV3({
  comparison,
  onHighlight,
  onClearHighlight,
  onStartDocking,
  activeDockingPocketId,
}: {
  comparison: ComparisonData | null;
  onHighlight: (indices: number[], target: string) => void;
  onClearHighlight: (target: string) => void;
  onStartDocking?: (pocket: Pocket, sourceType: string) => void;
  activeDockingPocketId?: number;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pocketView, setPocketView] = useState<'grid' | 'list'>('grid');

  const handlePocketHighlight = useCallback(
    (indices: number[], key: string, target: string) => {
      if (activeKey === key) {
        setActiveKey(null);
        onClearHighlight(target);
      } else {
        setActiveKey(key);
        onHighlight(indices, target);
      }
    },
    [activeKey, onHighlight, onClearHighlight],
  );

  if (!comparison) {
    return (
      <div className="flex items-center justify-center py-16 text-[14px]" style={{ color: '#7A8580' }}>
        Comparison data not available for this complex.
      </div>
    );
  }

  const {
    summary_metrics, ddgi, pocket_mapping, interface_pockets, conserved_pockets,
    emergent_pockets, graph_datasets, property_changes, stabilization_stats, fragment_comparison,
  } = comparison;

  const hasFragments = fragment_comparison &&
    ((fragment_comparison.unique_interface_fragments?.length ?? 0) > 0 ||
     (fragment_comparison.unique_dimer_fragments?.length    ?? 0) > 0);

  const renderPocketGroup = (
    label: string,
    desc: string,
    pockets: Pocket[] | undefined,
    prefix: string,
    dotColor: string,
    dotBg: string,
    layout: 'grid' | 'list' = 'grid',
  ) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full mt-[5px] shrink-0"
          style={{ background: dotColor, boxShadow: `0 0 0 4px ${dotBg}` }} />
        <div>
          <h3 className="text-[16px] font-medium text-[#0B0F14] m-0">{label}</h3>
          <p className="text-[12.5px] m-0 mt-[2px]" style={{ color: '#7A8580' }}>{desc}</p>
        </div>
      </div>
      {pockets && pockets.length > 0 ? (
        layout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {pockets.map((pocket, idx) => {
              const key = `${prefix}-${idx}`;
              return (
                <PocketCard key={pocket.pocket_id} pocket={pocket} index={idx} layout="grid"
                  isActive={activeKey === key}
                  onHighlight={(indices) =>
                    handlePocketHighlight(indices, key, pocket.is_conserved ? 'both' : 'complex')
                  }
                  onStartDocking={onStartDocking ? (p) => onStartDocking(p, pocket.is_conserved ? 'conserved' : 'dimer') : undefined}
                  isDockingActive={activeDockingPocketId === pocket.pocket_id}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid rgba(11,15,20,0.08)' }}>
            {pockets.map((pocket, idx) => {
              const key = `${prefix}-${idx}`;
              return (
                <PocketCard key={pocket.pocket_id} pocket={pocket} index={idx} layout="list"
                  isActive={activeKey === key}
                  isLast={idx === pockets.length - 1}
                  onHighlight={(indices) =>
                    handlePocketHighlight(indices, key, pocket.is_conserved ? 'both' : 'complex')
                  }
                  onStartDocking={onStartDocking ? (p) => onStartDocking(p, pocket.is_conserved ? 'conserved' : 'dimer') : undefined}
                  isDockingActive={activeDockingPocketId === pocket.pocket_id}
                />
              );
            })}
          </div>
        )
      ) : (
        <div className="px-5 py-4 rounded-[12px] text-[13px]"
          style={{ background: 'rgba(11,15,20,0.03)', border: '1px solid rgba(11,15,20,0.07)', color: '#7A8580' }}>
          No pockets found.
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-10">

      {/* ── 1. Summary stats ── */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 rounded-[16px] overflow-hidden"
        style={{ border: '1px solid rgba(11,15,20,0.07)', gap: '1px', background: 'rgba(11,15,20,0.07)' }}
      >
        {[
          { label: 'Monomer Pockets', value: String(summary_metrics.total_monomer_pockets), color: '#0B0F14' },
          { label: 'Dimer Pockets',   value: String(summary_metrics.total_dimer_pockets),   color: '#047857' },
          { label: 'Interface Pockets', value: String(pocket_mapping.interface_count),       color: '#047857' },
          {
            label: 'DDGI Score',
            value: `${ddgi > 0 ? '+' : ''}${ddgi.toFixed(3)}`,
            color: ddgi > 0 ? '#047857' : '#DC2626',
            title: 'Dimerization Druggability Gain Index: Avg Dimer Score − Avg Monomer Score',
          },
        ].map(({ label, value, color, title }) => (
          <div key={label} className="flex flex-col items-center justify-center py-5 px-4 bg-white text-center">
            <span className="text-[10px] uppercase tracking-[0.07em] mb-2" title={title}
              style={{ color: 'rgba(11,15,20,0.35)', cursor: title ? 'help' : 'default' }}>
              {label}
            </span>
            <span className="text-[22px] font-medium font-mono" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── 2. Transition map + Property shifts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pocket Transition Map */}
        <div className="rounded-[16px] p-5 flex flex-col gap-4"
          style={{ border: '1px solid rgba(11,15,20,0.08)', background: '#FAFBFA' }}>
          <div style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '12px' }}>
            <p className="text-[11px] uppercase tracking-[0.07em] m-0 mb-[3px]" style={{ color: 'rgba(11,15,20,0.38)' }}>
              Analysis
            </p>
            <h4 className="text-[14px] font-medium text-[#0B0F14] m-0">Pocket Transition Map</h4>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Conserved in both states',      value: pocket_mapping.conserved_count,     color: '#B45309' },
              { label: 'Disappeared upon dimerization', value: pocket_mapping.monomer_only_count,  color: '#DC2626' },
              { label: 'Newly emerged in dimer',        value: pocket_mapping.emergent_count,      color: '#047857' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <span className="text-[13px]" style={{ color: '#4A554D' }}>{label}</span>
                <span className="text-[18px] font-medium font-mono" style={{ color }}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3 mt-1"
              style={{ borderTop: '1px solid rgba(11,15,20,0.07)' }}>
              <span className="text-[12px]" style={{ color: '#7A8580' }}>Interface Residue Enrichment</span>
              <span className="text-[15px] font-medium font-mono text-[#0B0F14]">
                {stabilization_stats.enrichment_score.toFixed(2)}×
              </span>
            </div>
          </div>
        </div>

        {/* Property Shifts */}
        <div className="rounded-[16px] p-5 flex flex-col gap-4"
          style={{ border: '1px solid rgba(11,15,20,0.08)', background: '#FAFBFA' }}>
          <div style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '12px' }}>
            <p className="text-[11px] uppercase tracking-[0.07em] m-0 mb-[3px]" style={{ color: 'rgba(11,15,20,0.38)' }}>
              Average change
            </p>
            <h4 className="text-[14px] font-medium text-[#0B0F14] m-0">Property Shifts</h4>
          </div>
          <div className="flex flex-col gap-[14px]">
            {[
              {
                label: 'Volume',
                mono: property_changes.monomer_avg_volume.toFixed(0),
                dimer: property_changes.dimer_avg_volume.toFixed(0),
                unit: ' ų',
              },
              {
                label: 'Hydrophobicity',
                mono: property_changes.monomer_avg_hydrophobicity.toFixed(2),
                dimer: property_changes.dimer_avg_hydrophobicity.toFixed(2),
                unit: '',
              },
              {
                label: 'Polarity',
                mono: property_changes.monomer_avg_polarity.toFixed(2),
                dimer: property_changes.dimer_avg_polarity.toFixed(2),
                unit: '',
              },
            ].map(({ label, mono, dimer, unit }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-[12.5px]" style={{ color: '#7A8580' }}>{label}</span>
                <span className="text-[12px] font-mono" style={{ color: '#4A554D' }}>
                  {mono}{unit}{' '}
                  <span style={{ color: 'rgba(11,15,20,0.28)' }}>→</span>
                  {' '}{dimer}{unit}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 pt-3 mt-1"
              style={{ borderTop: '1px solid rgba(11,15,20,0.07)' }}>
              <span className="text-[13px] font-medium text-[#0B0F14]">Avg Druggability</span>
              <span className="text-[13px] font-medium font-mono"
                style={{ color: ddgi > 0 ? '#047857' : '#DC2626' }}>
                {summary_metrics.avg_monomer_druggability.toFixed(3)}{' '}
                <span style={{ color: 'rgba(11,15,20,0.28)' }}>→</span>{' '}
                {summary_metrics.avg_dimer_druggability.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Pocket groups ── */}
      {/* Pocket groups header with view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.07em] m-0 mb-[3px]" style={{ color: 'rgba(11,15,20,0.38)' }}>
            Binding sites
          </p>
          <h3 className="text-[16px] font-medium text-[#0B0F14] m-0">Pocket Groups</h3>
        </div>
        <div className="flex items-center rounded-[8px] p-[3px] gap-[2px]" style={{ background: 'rgba(11,15,20,0.05)' }}>
          {([
            { mode: 'grid' as const, title: 'Grid view',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor"/>
                <rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor"/>
                <rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor"/>
                <rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor"/>
              </svg> },
            { mode: 'list' as const, title: 'List view',
              icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2"  width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="6"  width="12" height="1.5" rx="0.75" fill="currentColor"/>
                <rect x="1" y="10" width="12" height="1.5" rx="0.75" fill="currentColor"/>
              </svg> },
          ] as const).map(({ mode, title, icon }) => (
            <button
              key={mode}
              onClick={() => setPocketView(mode)}
              title={title}
              className="w-[28px] h-[24px] rounded-[6px] flex items-center justify-center transition-colors duration-150"
              style={{
                background:  pocketView === mode ? 'white' : 'transparent',
                boxShadow:   pocketView === mode ? '0 1px 3px rgba(11,15,20,0.1)' : 'none',
                color:       pocketView === mode ? '#0B0F14' : 'rgba(11,15,20,0.35)',
              }}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {renderPocketGroup(
        'True Interface Drug Targets',
        'Pockets spanning multiple chains at the dimer interaction surface.',
        interface_pockets,
        'int',
        '#10b981', 'rgba(16,185,129,0.12)',
        pocketView,
      )}

      {renderPocketGroup(
        'Conserved Pockets',
        'Pockets retained from monomer to dimer — spatially overlapping in both structures.',
        conserved_pockets,
        'con',
        '#ca8a04', 'rgba(234,179,8,0.12)',
        pocketView,
      )}

      {renderPocketGroup(
        'Emergent Dimer-only Pockets',
        'Pockets that physically appear in the dimer but belong to a single chain.',
        emergent_pockets,
        'emg',
        '#8b5cf6', 'rgba(139,92,246,0.12)',
        pocketView,
      )}

      {/* ── 7. Fragment comparison ── */}
      {hasFragments && (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.07em] m-0 mb-1" style={{ color: 'rgba(11,15,20,0.38)' }}>
              ChEMBL
            </p>
            <h3 className="text-[18px] font-medium text-[#0B0F14] m-0">Novel Fragment Suggestions</h3>
            <p className="text-[13px] m-0 mt-[4px]" style={{ color: '#7A8580' }}>
              Compounds from ChEMBL unique to the dimerized state — not suggested for any monomer pocket.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Interface fragments */}
            <div className="rounded-[16px] p-5 flex flex-col gap-4"
              style={{ border: '1px solid rgba(16,185,129,0.22)', background: 'rgba(16,185,129,0.03)' }}>
              <div className="flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(16,185,129,0.12)', paddingBottom: '12px' }}>
                <h4 className="text-[13px] font-medium m-0" style={{ color: '#047857' }}>
                  Interface Pocket Fragments
                </h4>
                <span className="text-[10.5px] font-mono px-3 py-1 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.10)', color: '#047857', border: '1px solid rgba(16,185,129,0.22)' }}>
                  {fragment_comparison!.unique_interface_fragments?.length ?? 0} compounds
                </span>
              </div>
              <p className="text-[12px] m-0" style={{ color: '#7A8580' }}>
                Fragments targeting pockets at the protein–protein interface — highest value for PPI inhibitor design.
              </p>
              <FragmentListV3 fragments={fragment_comparison!.unique_interface_fragments} />
            </div>

            {/* Dimer-only fragments */}
            <div className="rounded-[16px] p-5 flex flex-col gap-4"
              style={{ border: '1px solid rgba(11,15,20,0.08)', background: '#FAFBFA' }}>
              <div className="flex items-center justify-between"
                style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '12px' }}>
                <h4 className="text-[13px] font-medium text-[#0B0F14] m-0">Dimer-only Fragments</h4>
                <span className="text-[10.5px] font-mono px-3 py-1 rounded-full"
                  style={{ background: 'rgba(11,15,20,0.05)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.10)' }}>
                  {fragment_comparison!.unique_dimer_fragments?.length ?? 0} compounds
                </span>
              </div>
              <p className="text-[12px] m-0" style={{ color: '#7A8580' }}>
                Fragments unique to any dimer pocket (emergent and conserved) not found in monomer analysis.
              </p>
              <FragmentListV3 fragments={fragment_comparison!.unique_dimer_fragments} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Skeleton primitives ───────────────────────────────────────────────────────

/** Single pulsing block — the atom for all skeletons. */
function Sk({ w, h = '14px', r = '8px', style }: { w?: string; h?: string; r?: string; style?: React.CSSProperties }) {
  return (
    <div
      className="animate-pulse shrink-0"
      style={{ width: w ?? '100%', height: h, borderRadius: r, background: 'rgba(11,15,20,0.08)', ...style }}
    />
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {/* alphafold id + badges row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Sk w="130px" h="12px" r="6px" />
        <div className="flex gap-2">
          <Sk w="88px" h="22px" r="99px" />
          <Sk w="70px" h="22px" r="99px" />
        </div>
      </div>
      {/* Protein name – big headline */}
      <div className="flex flex-col gap-[10px]">
        <Sk w="72%" h="40px" r="10px" />
        <Sk w="40%" h="40px" r="10px" />
      </div>
      {/* Gene · organism · uniprot */}
      <div className="flex items-center gap-3 flex-wrap">
        <Sk w="64px" h="14px" r="6px" />
        <Sk w="140px" h="14px" r="6px" />
        <Sk w="80px" h="14px" r="6px" />
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 rounded-[16px] overflow-hidden"
      style={{ border: '1px solid rgba(11,15,20,0.07)', gap: '1px', background: 'rgba(11,15,20,0.06)' }}
    >
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex flex-col items-center justify-center py-5 px-4 gap-3"
          style={{ background: '#FAFBFA' }}>
          <Sk w="90px" h="10px" r="5px" />
          <Sk w="60px" h="26px" r="6px" />
        </div>
      ))}
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* Section heading skeleton */}
      <div className="flex flex-col gap-2 pb-4" style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}>
        <Sk w="180px" h="22px" r="6px" />
        <Sk w="320px" h="13px" r="5px" />
      </div>
      {/* Viewer panels */}
      <div className="flex rounded-[12px] overflow-hidden"
        style={{ border: '1px solid rgba(11,15,20,0.07)', gap: '1px', background: 'rgba(11,15,20,0.06)', height: '400px' }}>
        <div className="flex-1 animate-pulse" style={{ background: 'rgba(11,15,20,0.04)' }} />
        <div style={{ width: '48px', background: '#F8FAFC' }} />
        <div className="flex-1 animate-pulse" style={{ background: 'rgba(11,15,20,0.04)' }} />
      </div>
      {/* pLDDT legend bar skeleton */}
      <div className="flex items-center justify-center gap-4 px-4 py-3 rounded-[10px]"
        style={{ background: '#F8FAFC', border: '1px solid rgba(11,15,20,0.07)' }}>
        <Sk w="180px" h="10px" r="5px" />
        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-1.5">
              <Sk w="12px" h="12px" r="99px" />
              <Sk w="72px" h="10px" r="5px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BindingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-5"
        style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}>
        <div className="flex flex-col gap-2">
          <Sk w="210px" h="22px" r="6px" />
          <Sk w="270px" h="13px" r="5px" />
        </div>
        <Sk w="200px" h="36px" r="10px" />
      </div>
      {/* 6 pocket card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-[16px] overflow-hidden"
            style={{ border: '1px solid rgba(11,15,20,0.08)' }}>
            {/* Coloured header zone skeleton */}
            <div className="px-5 pt-5 pb-4 flex flex-col gap-3 animate-pulse"
              style={{ background: 'rgba(11,15,20,0.04)' }}>
              <div className="flex justify-between">
                <div className="flex flex-col gap-2">
                  <Sk w="40px" h="10px" r="4px" />
                  <Sk w="36px" h="32px" r="6px" />
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Sk w="64px" h="10px" r="4px" />
                  <Sk w="48px" h="32px" r="6px" />
                </div>
              </div>
              <Sk h="6px" r="3px" />
            </div>
            {/* White body zone skeleton */}
            <div className="bg-white px-4 py-3 flex flex-col gap-3"
              style={{ borderTop: '1px solid rgba(11,15,20,0.07)' }}>
              <div className="grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map(j => (
                  <div key={j} className="flex flex-col items-center gap-1">
                    <Sk w="36px" h="9px" r="4px" />
                    <Sk w="28px" h="13px" r="4px" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  {[0, 1, 2].map(j => <Sk key={j} w="28px" h="18px" r="4px" />)}
                </div>
                <Sk w="72px" h="26px" r="99px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Binding sites section ─────────────────────────────────────────────────────

type SiteTab = 'monomer' | 'complex' | 'comparison';

const TAB_LABELS: Record<SiteTab, string> = {
  monomer:    'Monomer',
  complex:    'Dimer',
  comparison: 'Comparison',
};

function BindingSitesV3({
  complexId,
  onHighlight,
  onClearHighlight,
  monomerUrl,
  complexUrl,
  onStartDocking,
  activeDockingPocketId,
}: {
  complexId: string | undefined;
  onHighlight: (indices: number[], target: string) => void;
  onClearHighlight: (target: string) => void;
  monomerUrl: string;
  complexUrl: string;
  onStartDocking?: (pocket: Pocket, sourceType: string) => void;
  activeDockingPocketId?: number;
}) {
  const [tab, setTab] = useState<SiteTab>('monomer');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [pocketView, setPocketView] = useState<'grid' | 'list'>('grid');

  const { pockets, totalPockets, monomerPockets, monomerTotalPockets, interfaceCount, loading, error, comparison } =
    useBindingSites(complexId, true);

  const allPockets = tab === 'monomer' ? monomerPockets : pockets;
  const total      = tab === 'monomer' ? monomerTotalPockets : totalPockets;
  const displayed  = showAll ? allPockets : allPockets.slice(0, 6);

  const handleHighlight = useCallback((indices: number[], idx: number) => {
    if (activeIdx === idx) {
      setActiveIdx(null);
      onClearHighlight(tab);
    } else {
      setActiveIdx(idx);
      onHighlight(indices, tab);
    }
  }, [activeIdx, tab, onHighlight, onClearHighlight]);

  const handleTabSwitch = (next: SiteTab) => {
    if (activeIdx !== null) {
      onClearHighlight(tab);
      setActiveIdx(null);
    }
    setTab(next);
    setShowAll(false);
  };

  const subtitleMap: Record<SiteTab, string> = {
    monomer:    'fpocket analysis · single chain',
    complex:    'fpocket analysis · homodimer, disorder delta filtered',
    comparison: 'monomer vs. dimer comparative analysis',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Section label */}
      <div
        className="flex items-center justify-between flex-wrap gap-4 pb-5"
        style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}
      >
        <div>
          <h2
            className="font-medium tracking-[-0.025em] text-[#0B0F14] m-0 mb-1"
            style={{ fontSize: '22px' }}
          >
            Predicted Binding Sites
          </h2>
          <p className="text-[14px] text-[#7A8580] m-0">
            {subtitleMap[tab]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-[3px] rounded-[10px]" style={{ background: 'rgba(11,15,20,0.05)' }}>
            {(['monomer', 'complex', 'comparison'] as SiteTab[]).map((t) => (
              <button
                key={t}
                onClick={() => handleTabSwitch(t)}
                className="px-4 py-[7px] rounded-[8px] text-[11px] tracking-[0.04em] uppercase transition-colors duration-150"
                style={
                  tab === t
                    ? { background: 'white', color: '#0B0F14', boxShadow: '0 1px 3px rgba(11,15,20,0.1)' }
                    : { background: 'transparent', color: 'rgba(11,15,20,0.45)' }
                }
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* View toggle — only for monomer / complex tabs */}
          {tab !== 'comparison' && (
            <div className="flex items-center rounded-[8px] p-[3px] gap-[2px]" style={{ background: 'rgba(11,15,20,0.05)' }}>
              {([
                { mode: 'grid' as const, title: 'Grid view',
                  icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1.5" fill="currentColor"/>
                    <rect x="8" y="1" width="5" height="5" rx="1.5" fill="currentColor"/>
                    <rect x="1" y="8" width="5" height="5" rx="1.5" fill="currentColor"/>
                    <rect x="8" y="8" width="5" height="5" rx="1.5" fill="currentColor"/>
                  </svg> },
                { mode: 'list' as const, title: 'List view',
                  icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2"  width="12" height="1.5" rx="0.75" fill="currentColor"/>
                    <rect x="1" y="6"  width="12" height="1.5" rx="0.75" fill="currentColor"/>
                    <rect x="1" y="10" width="12" height="1.5" rx="0.75" fill="currentColor"/>
                  </svg> },
              ] as const).map(({ mode, title, icon }) => (
                <button
                  key={mode}
                  onClick={() => setPocketView(mode)}
                  title={title}
                  className="w-[28px] h-[24px] rounded-[6px] flex items-center justify-center transition-colors duration-150"
                  style={{
                    background:  pocketView === mode ? 'white' : 'transparent',
                    boxShadow:   pocketView === mode ? '0 1px 3px rgba(11,15,20,0.1)' : 'none',
                    color:       pocketView === mode ? '#0B0F14' : 'rgba(11,15,20,0.35)',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interface pocket count badge */}
      {tab === 'complex' && interfaceCount > 0 && (
        <div
          className="self-start flex items-center gap-2 px-4 py-[6px] rounded-full text-[12px] font-medium"
          style={{ background: 'rgba(16,185,129,0.08)', color: '#047857', border: '1px solid rgba(16,185,129,0.22)' }}
        >
          <div className="w-[6px] h-[6px] rounded-full bg-[#047857] animate-pulse" />
          {interfaceCount} interface pocket{interfaceCount > 1 ? 's' : ''} detected
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <div
            className="w-4 h-4 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(11,15,20,0.12)', borderTopColor: '#0B0F14' }}
          />
          <span className="text-[14px] text-[#7A8580]">Running fpocket analysis…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="px-5 py-4 rounded-[12px] text-[14px]"
          style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#DC2626' }}
        >
          {error}
        </div>
      )}

      {/* ── Comparison tab ── */}
      {!loading && !error && tab === 'comparison' && (
        <ComparisonV3
          comparison={comparison}
          onHighlight={onHighlight}
          onClearHighlight={onClearHighlight}
          onStartDocking={onStartDocking}
          activeDockingPocketId={activeDockingPocketId}
        />
      )}

      {/* ── Pocket grid (monomer / complex tabs) ── */}
      {!loading && !error && tab !== 'comparison' && (
        <>
          {displayed.length > 0 ? (
            pocketView === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayed.map((pocket, idx) => (
                  <PocketCard key={pocket.pocket_id} pocket={pocket} index={idx} layout="grid"
                    isActive={activeIdx === idx}
                    onHighlight={(indices) => handleHighlight(indices, idx)}
                    onStartDocking={onStartDocking ? (p) => onStartDocking(p, tab === 'monomer' ? 'monomer' : 'dimer') : undefined}
                    isDockingActive={activeDockingPocketId === pocket.pocket_id} />
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid rgba(11,15,20,0.08)' }}>
                {displayed.map((pocket, idx) => (
                  <PocketCard key={pocket.pocket_id} pocket={pocket} index={idx} layout="list"
                    isActive={activeIdx === idx}
                    isLast={idx === displayed.length - 1}
                    onHighlight={(indices) => handleHighlight(indices, idx)}
                    onStartDocking={onStartDocking ? (p) => onStartDocking(p, tab === 'monomer' ? 'monomer' : 'dimer') : undefined}
                    isDockingActive={activeDockingPocketId === pocket.pocket_id} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-[15px] text-[#7A8580]">
              No pockets found for the {tab} structure.
            </div>
          )}

          {/* Show more */}
          {total > displayed.length && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="self-center text-[11px] uppercase tracking-[0.05em] px-5 py-[8px] rounded-full transition-colors duration-150"
              style={{ background: 'rgba(11,15,20,0.04)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.10)' }}
            >
              Show all {total} pockets ↓
            </button>
          )}

          {/* Legend */}
          <div
            className="flex items-center gap-5 flex-wrap pt-4"
            style={{ borderTop: '1px solid rgba(11,15,20,0.06)' }}
          >
            <span className="text-[10px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.32)' }}>
              Legend
            </span>
            {[
              { color: '#047857', bg: 'rgba(16,185,129,0.1)',  label: 'Interface (Δ pLDDT ≥ 5)' },
              { color: '#4338CA', bg: 'rgba(99,102,241,0.09)', label: 'Emergent (dimer only)'     },
              { color: '#B45309', bg: 'rgba(245,158,11,0.09)', label: 'Conserved'                 },
            ].map(({ color, bg, label }) => (
              <div key={label} className="flex items-center gap-[6px]">
                <div className="w-[8px] h-[8px] rounded-full" style={{ background: color, boxShadow: `0 0 0 3px ${bg}` }} />
                <span className="text-[10px]" style={{ color: 'rgba(11,15,20,0.45)' }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Inline Mutation Form (v3-native) ─────────────────────────────────────────

const MUTATION_EXAMPLES = ['T790M', 'G12C', 'T315I'];

function InlineMutationForm({
  uniprotId,
  mutation,
  onMutationChange,
  onSubmit,
  onReset,
  loading,
  hasRun,
}: {
  uniprotId: string;
  mutation: string;
  onMutationChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  loading: boolean;
  hasRun: boolean;
}) {
  const canSubmit = mutation.trim().length > 0 && !loading;
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-center justify-between flex-wrap gap-4 pb-5"
        style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.07em] m-0 mb-1" style={{ color: 'rgba(11,15,20,0.38)' }}>
            Point mutation
          </p>
          <h2 className="font-medium tracking-[-0.025em] text-[#0B0F14] m-0" style={{ fontSize: '22px' }}>
            Mutation Impact Analysis
          </h2>
          <p className="text-[14px] text-[#7A8580] m-0 mt-1">
            Predict how a point mutation affects pocket druggability for{' '}
            <span className="font-mono font-semibold text-[#0B0F14]">{uniprotId}</span>
          </p>
        </div>
        {hasRun && (
          <button
            onClick={onReset}
            className="text-[11px] uppercase tracking-[0.05em] transition-opacity duration-150 hover:opacity-60"
            style={{ color: '#4A554D' }}
          >
            ← New mutation
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* UniProt ID — read-only display */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
            UniProt ID
          </label>
          <div
            className="flex items-center gap-2 px-4 py-[10px] rounded-[10px] font-mono text-[14px]"
            style={{ background: 'rgba(11,15,20,0.04)', border: '1px solid rgba(11,15,20,0.08)', color: '#0B0F14' }}
          >
            {uniprotId}
            <span
              className="text-[10px] uppercase tracking-[0.05em] px-[8px] py-[2px] rounded-full"
              style={{ background: 'rgba(11,15,20,0.07)', color: 'rgba(11,15,20,0.40)' }}
            >
              Pre-filled
            </span>
          </div>
        </div>

        {/* Mutation input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
            Mutation
          </label>
          <input
            type="text"
            value={mutation}
            onChange={e => onMutationChange(e.target.value)}
            placeholder="e.g. T790M or EGFR T790M"
            disabled={loading}
            className="text-[14px] font-mono px-4 py-3 rounded-[10px] outline-none w-full transition-colors duration-150 disabled:opacity-50"
            style={{ background: 'white', border: '1px solid rgba(11,15,20,0.12)', color: '#0B0F14' }}
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="text-[12px] font-medium uppercase tracking-[0.07em] px-5 py-[9px] rounded-full transition-colors duration-150 disabled:opacity-40"
            style={
              canSubmit
                ? { background: '#0B0F14', color: 'white', border: '1px solid #0B0F14' }
                : { background: 'rgba(11,15,20,0.06)', color: 'rgba(11,15,20,0.30)', border: '1px solid rgba(11,15,20,0.08)' }
            }
          >
            {loading ? 'Analyzing…' : 'Analyze Mutation'}
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.35)' }}>
              Try:
            </span>
            {MUTATION_EXAMPLES.map(ex => (
              <button
                key={ex}
                type="button"
                disabled={loading}
                onClick={() => onMutationChange(ex)}
                className="text-[11px] font-mono px-[10px] py-[4px] rounded-full transition-colors duration-150 disabled:opacity-40"
                style={{ background: 'rgba(11,15,20,0.04)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.10)' }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Inline Mutation Result Card (v3-native) ───────────────────────────────────

function InlineMutationResultCard({ result }: { result: MutationAnalyzeResult }) {
  const { uniprot_id, mutation, alphamissense, structures, pockets, druggability_shift } = result;
  const { score, classification, confidence } = druggability_shift;

  const amColors: Record<string, { bg: string; color: string; border: string }> = {
    pathogenic: { bg: 'rgba(220,38,38,0.07)',  color: '#DC2626', border: 'rgba(220,38,38,0.22)'  },
    ambiguous:  { bg: 'rgba(245,158,11,0.09)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    benign:     { bg: 'rgba(11,15,20,0.04)',   color: '#7A8580', border: 'rgba(11,15,20,0.12)'   },
  };
  const amStyle = amColors[alphamissense.am_class] ?? amColors.ambiguous;

  const dssColor = score >= 0.15 ? '#047857' : score >= -0.15 ? '#7A8580' : score >= -0.5 ? '#B45309' : '#DC2626';
  const dssLabel = ({
    pocket_improved:     'Pocket Improved',
    pocket_unchanged:    'Pocket Unchanged',
    pocket_degraded:     'Pocket Degraded',
    pocket_collapsed:    'Pocket Collapsed',
    new_pocket_detected: 'New Pocket Detected',
  } as Record<string, string>)[classification] ?? classification;

  const positionPct = ((score + 1) / 2) * 100;
  const fillLeft    = score >= 0 ? 50 : positionPct;
  const fillWidth   = Math.abs(positionPct - 50);

  return (
    <div className="rounded-[16px] overflow-hidden" style={{ border: '1px solid rgba(11,15,20,0.08)' }}>
      {/* Header */}
      <div
        className="flex items-center flex-wrap gap-3 px-5 py-4"
        style={{ background: '#FAFBFA', borderBottom: '1px solid rgba(11,15,20,0.07)' }}
      >
        <span className="font-mono text-[13px] font-semibold text-[#0B0F14]">{uniprot_id}</span>
        <span className="font-mono text-[13px]" style={{ color: '#7A8580' }}>
          {mutation.gene && <>{mutation.gene}{' '}</>}
          <span style={{ color: 'rgba(11,15,20,0.40)' }}>{mutation.wildtype_aa}</span>
          <span className="font-semibold text-[#0B0F14]">{mutation.position}</span>
          <span style={{ color: 'rgba(11,15,20,0.40)' }}>{mutation.mutant_aa}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.35)' }}>
            AlphaMissense
          </span>
          <span
            className="text-[10.5px] uppercase tracking-[0.05em] px-[10px] py-[3px] rounded-full"
            style={{ background: amStyle.bg, color: amStyle.color, border: `1px solid ${amStyle.border}` }}
          >
            {alphamissense.am_class}
          </span>
          <span className="font-mono text-[12px] tabular-nums" style={{ color: '#4A554D' }}>
            {alphamissense.am_pathogenicity.toFixed(4)}
          </span>
        </div>
      </div>

      {/* DSS Score bar */}
      <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: '1px solid rgba(11,15,20,0.07)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
            Druggability Shift Score
          </span>
          <span
            className="text-[10.5px] uppercase tracking-[0.05em] px-[10px] py-[3px] rounded-full"
            style={
              confidence === 'high'
                ? { background: 'rgba(16,185,129,0.08)', color: '#047857', border: '1px solid rgba(16,185,129,0.22)' }
                : { background: 'rgba(245,158,11,0.09)', color: '#B45309', border: '1px solid rgba(245,158,11,0.25)' }
            }
          >
            {confidence} confidence
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono w-4 text-right" style={{ color: 'rgba(11,15,20,0.38)' }}>−1</span>
          <div className="relative flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(11,15,20,0.08)' }}>
            <div
              className="absolute top-0 left-1/2 w-px h-full z-10"
              style={{ background: 'rgba(11,15,20,0.20)', transform: 'translateX(-50%)' }}
            />
            <div
              className="absolute top-0 h-full rounded-full transition-all duration-300"
              style={{ left: `${fillLeft}%`, width: `${Math.max(fillWidth, 0.5)}%`, background: dssColor }}
            />
          </div>
          <span className="text-[10px] font-mono w-4" style={{ color: 'rgba(11,15,20,0.38)' }}>+1</span>
          <span className="text-[20px] font-semibold font-mono w-[76px] text-right tabular-nums" style={{ color: dssColor }}>
            {score >= 0 ? '+' : ''}{score.toFixed(3)}
          </span>
        </div>

        <span
          className="text-[10.5px] uppercase tracking-[0.05em] self-start px-[10px] py-[3px] rounded-full"
          style={
            score >= 0.15
              ? { background: 'rgba(16,185,129,0.08)', color: '#047857', border: '1px solid rgba(16,185,129,0.22)' }
              : score >= -0.15
              ? { background: 'rgba(11,15,20,0.04)',   color: '#7A8580', border: '1px solid rgba(11,15,20,0.10)'   }
              : score >= -0.5
              ? { background: 'rgba(245,158,11,0.09)', color: '#B45309', border: '1px solid rgba(245,158,11,0.25)' }
              : { background: 'rgba(220,38,38,0.07)',  color: '#DC2626', border: '1px solid rgba(220,38,38,0.22)'  }
          }
        >
          {dssLabel}
        </span>
      </div>

      {/* Approximation warning */}
      {structures.mutant_is_approximation && (
        <div
          className="mx-5 my-3 px-4 py-3 rounded-[10px] text-[13px] leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', color: '#B45309' }}
        >
          <span className="font-medium">Note: </span>
          No experimental mutant structure found. Using wildtype AlphaFold as backbone approximation.
          Pocket geometry deltas are zero; DSS is weighted primarily by AlphaMissense. Confidence: low.
        </div>
      )}

      {/* Pocket geometry table */}
      <div className="px-5 py-4 flex flex-col gap-3">
        <span className="text-[11px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
          Pocket Geometry
        </span>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Metric', 'Wildtype', 'Mutant', 'Δ'].map((h, i) => (
                  <th
                    key={h}
                    className="pb-2 text-[10px] uppercase tracking-[0.06em]"
                    style={{ color: 'rgba(11,15,20,0.38)', textAlign: i === 0 ? 'left' : 'right', paddingRight: i < 3 ? '24px' : '0' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Druggability',   wt: pockets.wildtype_top_pocket.druggability_score, mut: pockets.mutant_top_pocket.druggability_score, delta: pockets.pocket_delta.druggability_score, dec: 3, good: true  },
                { label: 'Volume (Å³)',    wt: pockets.wildtype_top_pocket.volume,              mut: pockets.mutant_top_pocket.volume,              delta: pockets.pocket_delta.volume,              dec: 0, good: true  },
                { label: 'Surface (Å²)',   wt: pockets.wildtype_top_pocket.surface_area,        mut: pockets.mutant_top_pocket.surface_area,        delta: pockets.pocket_delta.surface_area,        dec: 0, good: true  },
                { label: 'Hydrophobicity', wt: pockets.wildtype_top_pocket.hydrophobicity,      mut: pockets.mutant_top_pocket.hydrophobicity,      delta: pockets.pocket_delta.hydrophobicity,      dec: 2, good: false },
              ].map(({ label, wt, mut, delta, dec, good }) => {
                const dColor = Math.abs(delta) < 0.001
                  ? 'rgba(11,15,20,0.35)'
                  : (good ? delta > 0 : delta < 0) ? '#047857' : '#DC2626';
                return (
                  <tr key={label} style={{ borderTop: '1px solid rgba(11,15,20,0.07)' }}>
                    <td className="py-[9px] pr-6 text-[11px] uppercase tracking-[0.05em] whitespace-nowrap" style={{ color: 'rgba(11,15,20,0.45)' }}>
                      {label}
                    </td>
                    <td className="py-[9px] pr-6 font-mono text-[13px] text-right text-[#0B0F14] tabular-nums">{wt.toFixed(dec)}</td>
                    <td className="py-[9px] pr-6 font-mono text-[13px] text-right text-[#0B0F14] tabular-nums">{mut.toFixed(dec)}</td>
                    <td className="py-[9px] font-mono text-[13px] text-right tabular-nums" style={{ color: dColor }}>
                      {delta >= 0 ? '+' : ''}{delta.toFixed(dec)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
            Mutant structure
          </span>
          <span
            className="text-[10.5px] uppercase tracking-[0.05em] px-[10px] py-[3px] rounded-full"
            style={
              structures.mutant_is_approximation
                ? { background: 'rgba(245,158,11,0.09)', color: '#B45309', border: '1px solid rgba(245,158,11,0.25)' }
                : { background: 'rgba(16,185,129,0.08)', color: '#047857', border: '1px solid rgba(16,185,129,0.22)' }
            }
          >
            {structures.mutant_is_approximation
              ? 'AlphaFold approx.'
              : structures.mutant_source === 'rcsb_experimental' ? 'RCSB Experimental' : structures.mutant_source}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ComplexDetailPageV3() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { complex, loading, error } = useComplex(id);
  const viewerRef = React.useRef<ProteinViewerHandle>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [activeDocking, setActiveDocking] = useState<(DockingInfo & { activeTab?: string }) | null>(null);

  const handleHighlight = useCallback((indices: number[], target: string) => {
    viewerRef.current?.highlightPocket?.(indices, target);
  }, []);

  const handleClearHighlight = useCallback((target: string) => {
    viewerRef.current?.clearPocketHighlight?.();
    viewerRef.current?.clearConformations?.(target);
  }, []);

  const handleStartDocking = useCallback((pocket: Pocket, sourceType: string) => {
    const proteinPdbId = sourceType === 'monomer'
      ? complex?.monomer_structure_url?.replace(/\.cif$/i, '.pdb') || ''
      : complex?.complex_structure_url?.replace(/\.cif$/i, '.pdb') || complex?.uniprot_id || '';

    const info: DockingInfo & { activeTab?: string } = {
      pocket,
      sourceType,
      proteinPdbId,
      activeTab: sourceType === 'monomer' ? 'monomer' : 'complex'
    };

    if (activeDocking?.pocket?.pocket_id === pocket.pocket_id && activeDocking?.sourceType === sourceType) {
      viewerRef.current?.clearConformations?.('both');
      setActiveDocking(null);
      return;
    }
    viewerRef.current?.clearConformations?.('both');
    setActiveDocking(info);
    setSelectedEntry(null);
  }, [activeDocking, complex]);

  const handleDockingComplete = useCallback((result: { pocketId: number; sourceType: string; fragmentId: string; fragmentName: string; smiles: string; bindingAffinity: number; conformations: Conformation[]; timestamp: number }) => {
    const entryId = `${result.sourceType}-${result.pocketId}-${result.fragmentId}-${Date.now()}`;
    const newEntry: LeaderboardEntry = { ...result, id: entryId };
    setLeaderboard((prev) => {
      if (prev.some(e => e.pocketId === result.pocketId && e.fragmentId === result.fragmentId && e.sourceType === result.sourceType)) return prev;
      return [...prev, newEntry];
    });
    setSelectedEntry(newEntry);
    setActiveDocking(null);
    viewerRef.current?.clearConformations?.('both');
    const target = result.sourceType === 'monomer' ? 'monomer' : 'complex';
    if (result.conformations?.length) { viewerRef.current?.setConformations?.(result.conformations, 1, target); }
  }, []);

  const handleUndock = useCallback(() => {
    viewerRef.current?.clearConformations?.('both');
    viewerRef.current?.clearPocketHighlight?.();
  }, []);

  const handleCloseDocking = useCallback(() => {
    handleUndock();
    setActiveDocking(null);
  }, [handleUndock]);

  const handleLeaderboardSelect = useCallback((entry: LeaderboardEntry) => {
    setSelectedEntry(entry);
    setActiveDocking(null);
    viewerRef.current?.clearConformations?.('both');
    const target = entry.sourceType === 'monomer' ? 'monomer' : 'complex';
    if (entry.conformations?.length) { viewerRef.current?.setConformations?.(entry.conformations, 1, target); }
  }, []);

  const handleLeaderboardRemove = useCallback((entryId: string) => {
    setLeaderboard((prev) => prev.filter(e => e.id !== entryId));
    setSelectedEntry((prev) => prev?.id === entryId ? null : prev);
  }, []);

  const handleConformationSelect = useCallback((entry: LeaderboardEntry, mode: number) => {
    const target = entry.sourceType === 'monomer' ? 'monomer' : 'complex';
    if (entry.conformations?.length) { viewerRef.current?.setConformations?.(entry.conformations, mode, target); }
  }, []);

  const handleConformationChange = useCallback((confs: Conformation[] | null, mode: number | null) => {
    const target = activeDocking?.activeTab === 'monomer' ? 'monomer' : 'complex';
    if (confs && mode != null) {
      viewerRef.current?.setConformations?.(confs, mode, target);
    } else {
      viewerRef.current?.clearConformations?.(target);
    }
  }, [activeDocking]);

  // ── Mutation analysis (inline) ───────────────────────────────────────────────
  const [showMutation, setShowMutation] = useState(false);
  const [mutationInput, setMutationInput] = useState('');
  const mutationSectionRef = useRef<HTMLDivElement>(null);
  const mutationPendingRef = useRef<{ uniprotId: string; mutation: string } | null>(null);

  const {
    structures: mutStructures,
    loading: structuresLoading,
    error: structuresError,
    fetchStructures,
    reset: resetStructures,
  } = useMutationStructures();

  const {
    result: mutationResult,
    loading: analysisLoading,
    error: analysisError,
    analyze,
    reset: resetAnalysis,
  } = useMutationAnalyze();

  // Two-phase orchestration: once structures arrive, auto-kick off analysis
  useEffect(() => {
    if (!mutStructures || !mutationPendingRef.current) return;
    const { uniprotId, mutation } = mutationPendingRef.current;
    analyze(uniprotId, mutation, mutStructures);
  }, [mutStructures, analyze]);

  const isMutationLoading = structuresLoading || analysisLoading;

  const handleMutationOpen = useCallback(() => {
    setShowMutation(true);
    // Give React one tick to mount the section, then scroll to it
    setTimeout(() => {
      mutationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, []);

  const handleMutationSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!mutationInput.trim() || isMutationLoading || !complex) return;
    mutationPendingRef.current = { uniprotId: complex.uniprot_id, mutation: mutationInput.trim() };
    resetAnalysis();
    fetchStructures(complex.uniprot_id, mutationInput.trim());
  }, [mutationInput, isMutationLoading, complex, resetAnalysis, fetchStructures]);

  const handleMutationInputChange = useCallback((v: string) => {
    setMutationInput(v);
    mutationPendingRef.current = null;
    resetStructures();
    resetAnalysis();
  }, [resetStructures, resetAnalysis]);

  const handleMutationReset = useCallback(() => {
    mutationPendingRef.current = null;
    resetStructures();
    resetAnalysis();
    setMutationInput('');
  }, [resetStructures, resetAnalysis]);

  // Derived display values
  const drugVariant: TagVariant | null = !complex ? null
    : complex.drug_count === -1 ? null
    : complex.drug_count === 0  ? 'undrugged'
    : 'drugged';
  const drugLabel = !complex ? ''
    : complex.drug_count === 0 ? 'Undrugged'
    : `${complex.drug_count} drug${complex.drug_count === 1 ? '' : 's'}`;

  const gapPct = complex ? Math.min((complex.gap_score / 2.0) * 100, 100) : 0;
  const gapColor = gapPct >= 75 ? '#047857' : gapPct >= 40 ? '#B45309' : '#7A8580';
  const deltaPositive = (complex?.disorder_delta ?? 0) > 0;

  return (
    <div className="bg-white min-h-screen font-geist antialiased" style={{ color: '#0B0F14' }}>
      <NavV3 />

      <main className="max-w-[1200px] mx-auto px-8 pt-[140px] pb-[80px] flex flex-col gap-14">

        {/* ── Back bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.05em] transition-opacity duration-150 hover:opacity-60"
            style={{ color: '#4A554D' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11 5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to results
          </button>
          {complex && (
            <button
              onClick={handleMutationOpen}
              className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.05em] transition-opacity duration-150 hover:opacity-60"
              style={{ color: showMutation ? '#047857' : '#4A554D' }}
            >
              {showMutation ? '↓ Mutation analysis' : 'Analyze mutation →'}
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="px-5 py-4 rounded-[12px] text-[14px]"
            style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#DC2626' }}>
            {error}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────
            Everything below renders in two phases:
              • While loading  → skeleton placeholder
              • After loaded   → real content
            The ProteinViewer is additionally code-split via React.lazy so
            its Mol* bundle is only fetched once the complex metadata lands.
        ───────────────────────────────────────────────────────────────── */}
        {!error && (
          <>
            {/* ── Phase 1: Protein header ── */}
            {loading || !complex ? <HeaderSkeleton /> : (
              <div className="flex flex-col gap-5">
                {/* AlphaFold ID + badges */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="text-[12px] tracking-[0.04em]" style={{ color: 'rgba(11,15,20,0.35)' }}>
                    {complex.alphafold_id}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {complex.review_status === 'unreviewed' && <Tag variant="unreviewed">Unreviewed</Tag>}
                    {complex.is_who_pathogen                && <Tag variant="who">WHO pathogen</Tag>}
                    {drugVariant                            && <Tag variant={drugVariant}>{drugLabel}</Tag>}
                  </div>
                </div>

                {/* Protein name */}
                <h1
                  className="font-medium tracking-[-0.035em] leading-[1.05] text-[#0B0F14] m-0"
                  style={{ fontSize: 'clamp(28px, 3.5vw, 46px)' }}
                >
                  {complex.protein_name}
                </h1>

                {/* Gene · organism · UniProt */}
                <div className="flex items-center gap-2 text-[15px] flex-wrap">
                  <span className="font-medium text-[#0B0F14]">{complex.gene_name}</span>
                  <span style={{ color: 'rgba(11,15,20,0.18)' }}>·</span>
                  <span className="italic text-[#4A554D]">{complex.organism}</span>
                  <span style={{ color: 'rgba(11,15,20,0.18)' }}>·</span>
                  <a
                    href={`https://www.uniprot.org/uniprotkb/${complex.uniprot_id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[13px] no-underline transition-opacity duration-150 hover:opacity-60"
                    style={{ color: '#0B0F14' }}
                  >
                    {complex.uniprot_id} ↗
                  </a>
                </div>

                {/* Disease associations */}
                {complex.disease_associations?.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10.5px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
                      Disease associations
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {complex.disease_associations.map((d, i) => (
                        <span key={i} className="text-[13px] px-3 py-[4px] rounded-full"
                          style={{ background: 'rgba(11,15,20,0.04)', color: '#4A554D', border: '1px solid rgba(11,15,20,0.08)' }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Phase 1: Metrics strip ── */}
            {loading || !complex ? <MetricsSkeleton /> : (
              <div
                className="grid grid-cols-2 md:grid-cols-4 rounded-[16px] overflow-hidden"
                style={{ border: '1px solid rgba(11,15,20,0.07)', gap: '1px', background: 'rgba(11,15,20,0.06)' }}
              >
                {[
                  {
                    label: 'Single chain pLDDT',
                    value: `${(complex.monomer_plddt_avg || 0).toFixed(1)}%`,
                    color: '#1d4ed8',
                    bg: 'rgba(59,130,246,0.06)',
                  },
                  {
                    label: 'Complex pLDDT',
                    value: `${(complex.dimer_plddt_avg || 0).toFixed(1)}%`,
                    color: '#047857',
                    bg: 'rgba(16,185,129,0.07)',
                  },
                  {
                    label: 'Disorder Δ',
                    value: `${deltaPositive ? '+' : ''}${(complex.disorder_delta || 0).toFixed(1)}`,
                    color: deltaPositive ? '#047857' : '#64748b',
                    bg: deltaPositive ? 'rgba(16,185,129,0.06)' : 'rgba(100,116,139,0.05)',
                  },
                  {
                    label: 'Gap Score',
                    value: `${gapPct.toFixed(1)}%`,
                    color: gapColor,
                    bg: gapPct >= 75
                      ? 'rgba(16,185,129,0.06)'
                      : gapPct >= 40
                      ? 'rgba(245,158,11,0.07)'
                      : 'rgba(11,15,20,0.03)',
                  },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className="flex flex-col items-center justify-center py-5 px-4 text-center"
                    style={{ background: bg }}>
                    <span className="text-[10px] uppercase tracking-[0.07em] mb-2" style={{ color: 'rgba(11,15,20,0.40)' }}>
                      {label}
                    </span>
                    <span className="text-[22px] font-medium" style={{ color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Phase 2: 3D Viewer — lazy-loaded, Suspense skeleton while Mol* boots ── */}
            {loading || !complex ? <ViewerSkeleton /> : (
              <div className="flex flex-col gap-3">
                <div style={{ borderBottom: '1px solid rgba(11,15,20,0.07)', paddingBottom: '16px', marginBottom: '4px' }}>
                  <h2 className="font-medium tracking-[-0.025em] text-[#0B0F14] m-0" style={{ fontSize: '22px' }}>
                    Structure Viewer
                  </h2>
                  <p className="text-[14px] text-[#7A8580] m-0 mt-1">
                    Monomer vs. homodimer comparison — AlphaFold confidence coloured
                  </p>
                </div>
                <React.Suspense fallback={
                  <div className="flex rounded-[12px] overflow-hidden animate-pulse"
                    style={{ border: '1px solid rgba(11,15,20,0.07)', background: 'rgba(11,15,20,0.04)', height: '400px' }}>
                    <div className="flex-1" />
                    <div style={{ width: '48px', background: '#F8FAFC' }} />
                    <div className="flex-1" />
                  </div>
                }>
                  <ProteinViewerLazy
                    ref={viewerRef}
                    monomerUrl={complex.monomer_structure_url}
                    complexUrl={complex.complex_structure_url}
                    monomerPlddt={complex.monomer_plddt_avg}
                    dimerPlddt={complex.dimer_plddt_avg}
                    disorderDelta={complex.disorder_delta}
                    theme="light"
                  />
                </React.Suspense>
              </div>
            )}

            {/* ── Phase 1: Known drugs (renders immediately when complex arrives) ── */}
            {!loading && complex && complex.known_drug_names?.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-[10.5px] uppercase tracking-[0.07em]" style={{ color: 'rgba(11,15,20,0.38)' }}>
                  Known drugs
                </span>
                <div className="flex flex-wrap gap-2">
                  {complex.known_drug_names.map((drug, i) => (
                    <span key={i} className="text-[12px] px-3 py-[5px] rounded-full"
                      style={{ background: 'rgba(16,185,129,0.07)', color: '#047857', border: '1px solid rgba(16,185,129,0.20)' }}>
                      {drug}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Phase 3: Binding sites — skeleton while complex loads, then runs
                fpocket in background with its own internal loading state ── */}
            {loading || !complex ? <BindingsSkeleton /> : (
              <BindingSitesV3
                complexId={id}
                onHighlight={handleHighlight}
                onClearHighlight={handleClearHighlight}
                monomerUrl={complex.monomer_structure_url?.replace(/\.cif$/i, '.pdb') || ''}
                complexUrl={complex.complex_structure_url?.replace(/\.cif$/i, '.pdb') || complex.uniprot_id || ''}
                onStartDocking={handleStartDocking}
                activeDockingPocketId={activeDocking?.pocket?.pocket_id}
              />
            )}

            {/* ── Vina Docking Section ── */}
            {!loading && complex && (
              <DockingSectionV3
                complexId={id}
                activeDocking={activeDocking}
                leaderboard={leaderboard}
                selectedEntry={selectedEntry}
                onDockingComplete={handleDockingComplete}
                onConformationChange={handleConformationChange}
                onUndock={handleUndock}
                onCloseDocking={handleCloseDocking}
                onSelectLeaderboardEntry={handleLeaderboardSelect}
                onRemoveLeaderboardEntry={handleLeaderboardRemove}
              />
            )}
            {/* ── Inline Mutation Analysis ── */}
            {showMutation && complex && (
              <div ref={mutationSectionRef} className="flex flex-col gap-6">
                <InlineMutationForm
                  uniprotId={complex.uniprot_id}
                  mutation={mutationInput}
                  onMutationChange={handleMutationInputChange}
                  onSubmit={handleMutationSubmit}
                  onReset={handleMutationReset}
                  loading={isMutationLoading}
                  hasRun={!!(mutStructures || structuresError)}
                />

                {/* Phase 1: fetching structures */}
                {structuresLoading && (
                  <div className="flex items-center gap-3 py-8 justify-center">
                    <div
                      className="w-4 h-4 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'rgba(11,15,20,0.12)', borderTopColor: '#0B0F14' }}
                    />
                    <span className="text-[14px]" style={{ color: '#7A8580' }}>
                      Fetching wildtype and mutant structures…
                    </span>
                  </div>
                )}

                {/* Structure error */}
                {!structuresLoading && structuresError && (
                  <div
                    className="px-5 py-4 rounded-[12px] text-[14px]"
                    style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#DC2626' }}
                  >
                    {structuresError}
                  </div>
                )}

                {/* Phases 2 + 3: structures loaded */}
                {mutStructures && !structuresError && (
                  <div className="flex flex-col gap-6">
                    <MutationViewer structures={mutStructures} />

                    {/* Phase 2: running pocket analysis */}
                    {analysisLoading && (
                      <div className="flex items-center gap-3 py-8 justify-center">
                        <div
                          className="w-4 h-4 rounded-full border-2 animate-spin"
                          style={{ borderColor: 'rgba(11,15,20,0.12)', borderTopColor: '#0B0F14' }}
                        />
                        <span className="text-[14px]" style={{ color: '#7A8580' }}>
                          Running pocket analysis and computing Druggability Shift Score…
                        </span>
                      </div>
                    )}

                    {/* Analysis error */}
                    {!analysisLoading && analysisError && (
                      <div
                        className="px-5 py-4 rounded-[12px] text-[14px]"
                        style={{ background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#DC2626' }}
                      >
                        {analysisError}
                      </div>
                    )}

                    {/* Phase 3: results */}
                    {!analysisLoading && !analysisError && mutationResult && (
                      <InlineMutationResultCard result={mutationResult} />
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <FooterV3 />
    </div>
  );
}
