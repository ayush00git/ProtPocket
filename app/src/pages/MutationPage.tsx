import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutationStructures } from '../hooks/useMutationStructures';
import { useMutationAnalyze } from '../hooks/useMutationAnalyze';
import { MutationForm } from '../components/mutation/MutationForm';
import { MutationViewer } from '../components/mutation/MutationViewer';
import { MutationResultCard } from '../components/mutation/MutationResultCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { NavV3 } from '../v3/components/NavV3';

export function MutationPage() {
  const [searchParams] = useSearchParams();
  const initialUniprotId = searchParams.get('uniprot_id') ?? undefined;

  const {
    structures, loading: structuresLoading, error: structuresError,
    fetchStructures, reset: resetStructures,
  } = useMutationStructures();

  const {
    result, loading: analysisLoading, error: analysisError,
    analyze, reset: resetAnalysis,
  } = useMutationAnalyze();

  // Auto-trigger analysis once structures are ready.
  const pendingRef = useRef<{ uniprotId: string; mutation: string } | null>(null);
  useEffect(() => {
    if (!structures || !pendingRef.current) return;
    const { uniprotId, mutation } = pendingRef.current;
    analyze(uniprotId, mutation, structures);
  }, [structures, analyze]);

  function handleSubmit(uniprotId: string, mutation: string) {
    pendingRef.current = { uniprotId, mutation };
    resetAnalysis();
    fetchStructures(uniprotId, mutation);
  }

  function handleInputChange() {
    pendingRef.current = null;
    resetStructures();
    resetAnalysis();
  }

  const isLoading = structuresLoading || analysisLoading;

  return (
    <div className="w-full flex flex-col items-center">
      <NavV3 />
      <div className="w-full max-w-[1100px] px-6 py-[48px] flex flex-col gap-8 mt-16">
        <div className="flex flex-col gap-3 max-w-[640px]">
          <span className="self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Feature still in progress
          </span>
          <h1 className="font-display font-bold text-[32px] text-text-primary">Mutation Impact Predictor</h1>
          <p className="font-body text-[15px] text-text-secondary leading-relaxed">
            Predict how a point mutation affects binding pocket druggability. Enter a UniProt ID and mutation
            (e.g. <span className="font-mono text-text-primary">EGFR T790M</span>) to fetch structures,
            render them in 3D, and compute the Druggability Shift Score.
          </p>
          <p className="font-mono text-[11px] text-text-muted">Analysis takes approximately 15–30 seconds.</p>
        </div>

        {/* Feature gated — AlphaMissense isn't enabled in this deployment yet. */}
        <div className="flex flex-col items-center text-center gap-3 py-14 px-6 rounded-[14px]"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            In progress
          </span>
          <span className="text-[16px] font-medium text-text-primary">Mutation impact analysis is coming soon</span>
          <span className="font-body text-[14px] text-text-secondary max-w-[460px] leading-relaxed">
            This feature relies on the AlphaMissense dataset, which isn't enabled in this deployment yet.
            Check back soon.
          </span>
        </div>
      </div>
    </div>
  );
}
