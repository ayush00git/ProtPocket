import { useState, useCallback, useRef } from 'react';
import { API_BASE } from '../config';
import { safeJson } from '../utils/safeFetch';
import type { MutationStructuresResult } from '../types';

export function useMutationStructures() {
  const [structures, setStructures] = useState<MutationStructuresResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStructures = useCallback(async (uniprotId: string, mutation: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setStructures(null);

    try {
      const resp = await fetch(`${API_BASE}/mutation/structures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniprot_id: uniprotId, mutation }),
        signal: controller.signal,
      });

      const body = await safeJson<MutationStructuresResult & { error?: string }>(resp);

      if (!resp.ok) {
        throw new Error(body?.error ?? `Request failed (HTTP ${resp.status})`);
      }
      if (!body) throw new Error('Server returned an empty response');
      setStructures(body);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStructures(null);
    setError(null);
  }, []);

  return { structures, loading, error, fetchStructures, reset };
}
