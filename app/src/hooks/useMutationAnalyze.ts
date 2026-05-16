import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../config';
import { safeJson } from '../utils/safeFetch';
import type { MutationAnalyzeResult, MutationStructuresResult } from '../types';

export function useMutationAnalyze() {
  const [result, setResult] = useState<MutationAnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (
    uniprotId: string,
    mutation: string,
    prefetchedStructures?: MutationStructuresResult,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResult(null);

    const body: Record<string, unknown> = { uniprot_id: uniprotId, mutation };
    if (prefetchedStructures) {
      body.wildtype_pdb_url      = prefetchedStructures.wildtype_pdb_url;
      body.wildtype_plddt        = prefetchedStructures.wildtype_plddt;
      body.mutant_pdb_url        = prefetchedStructures.mutant_pdb_url;
      body.mutant_source         = prefetchedStructures.mutant_source;
      body.mutant_is_approximation = prefetchedStructures.mutant_is_approximation;
      body.approximation_reason  = prefetchedStructures.approximation_reason ?? '';
    }

    try {
      const resp = await fetch(`${API_BASE}/mutation/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await safeJson<MutationAnalyzeResult & { error?: string }>(resp);

      if (!resp.ok) {
        if (resp.status === 404) throw new Error('Variant not found in AlphaMissense database');
        if (resp.status === 503) throw new Error('AlphaMissense database unavailable');
        throw new Error(data?.error ?? `Request failed (HTTP ${resp.status})`);
      }

      if (!data) throw new Error('Server returned an empty response');
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, reset };
}
