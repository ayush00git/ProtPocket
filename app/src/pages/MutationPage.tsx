import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutationStructures } from '../hooks/useMutationStructures';
import { useMutationAnalyze } from '../hooks/useMutationAnalyze';
import { MutationForm } from '../components/mutation/MutationForm';
import { MutationViewer } from '../components/mutation/MutationViewer';
import { MutationResultCard } from '../components/mutation/MutationResultCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

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
      <div className="w-full max-w-[1100px] px-6 py-[48px] flex flex-col gap-8">
        <div className="flex flex-col gap-3 max-w-[640px]">
          <h1 className="font-display font-bold text-[32px] text-text-primary">Mutation Impact Predictor</h1>
          <p className="font-body text-[15px] text-text-secondary leading-relaxed">
            Predict how a point mutation affects binding pocket druggability. Enter a UniProt ID and mutation
            (e.g. <span className="font-mono text-text-primary">EGFR T790M</span>) to fetch structures,
            render them in 3D, and compute the Druggability Shift Score.
          </p>
          <p className="font-mono text-[11px] text-text-muted">Analysis takes approximately 15–30 seconds.</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded p-5">
          <MutationForm
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            loading={isLoading}
            initialUniprotId={initialUniprotId}
          />
        </div>

        {/* Phase 1: fetching structures */}
        {structuresLoading && (
          <LoadingState message="Fetching wildtype and mutant structures…" />
        )}

        {/* Structure error */}
        {!structuresLoading && structuresError && (
          <ErrorState message={structuresError} />
        )}

        {/* Phases 2 + 3: structures ready → show viewer, then analysis */}
        {structures && !structuresError && (
          <div className="flex flex-col gap-6">
            <MutationViewer structures={structures} />

            {/* Phase 2: running pocket analysis */}
            {analysisLoading && (
              <LoadingState message="Running pocket analysis and computing Druggability Shift Score…" />
            )}

            {/* Analysis error */}
            {!analysisLoading && analysisError && (
              <ErrorState message={analysisError} />
            )}

            {/* Phase 3: results */}
            {!analysisLoading && !analysisError && result && (
              <MutationResultCard result={result} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
