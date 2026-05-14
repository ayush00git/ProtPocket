import { useState, useEffect, useCallback, useRef } from 'react';
import { safeJson } from '../utils/safeFetch';
import type { Fragment } from '../types';

interface ChemblOptions {
  volume?: number;
  hydrophobicity?: number;
  polarity?: number;
  sourceType?: string;
  lazy?: boolean;
}

/**
 * Normalizes fragment data from the API to ensure required fields.
 */
function normalizeFragment(f: Record<string, unknown>): Fragment {
  if (!f || typeof f !== 'object') return f as unknown as Fragment;
  return {
    ...f,
    mw: f.mw != null ? (f.mw as number) : (f.mol_weight as number | undefined),
    id: (f.chembl_id as string) || (f.zinc_id as string),
  } as Fragment;
}

/**
 * useChemblFragments — Standalone hook to fetch and cache ChEMBL fragment suggestions for a pocket.
 *
 * When options.lazy is true, fragments are NOT fetched automatically on mount —
 * call refetch() explicitly (e.g. when the user clicks "Dock Molecule").
 */
export function useChemblFragments(pocketId: number | string | null | undefined, options: ChemblOptions = {}, apiBase = '/api') {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Record<string, Fragment[]>>({});

  const fetchFragments = useCallback(async () => {
    if (pocketId == null || pocketId === '') return;

    // Check cache first
    const cacheKey = `${options.sourceType || 'dimer'}-${pocketId}`;
    if (cacheRef.current[cacheKey]) {
      setFragments(cacheRef.current[cacheKey]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    qs.set('pocket_id', String(pocketId));
    if (options.volume != null) qs.set('volume', String(options.volume));
    if (options.hydrophobicity != null) qs.set('hydrophobicity', String(options.hydrophobicity));
    if (options.polarity != null) qs.set('polarity', String(options.polarity));
    if (options.sourceType) qs.set('source_type', options.sourceType);

    try {
      const res = await fetch(`${apiBase}/chembl?${qs.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch fragments: HTTP ${res.status}`);
      }
      const json_data = await safeJson(res);
      const list = (Array.isArray(json_data) ? json_data : []).map(normalizeFragment);

      cacheRef.current[cacheKey] = list;
      setFragments(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown fragments error');
      setFragments([]);
    } finally {
      setIsLoading(false);
    }
  }, [pocketId, apiBase, options.volume, options.hydrophobicity, options.polarity, options.sourceType]);

  // Only auto-fetch if NOT lazy mode
  useEffect(() => {
    if (!options.lazy) {
      fetchFragments();
    }
  }, [fetchFragments, options.lazy]);

  return {
    fragments,
    isLoading,
    error,
    refetch: fetchFragments,
  };
}
