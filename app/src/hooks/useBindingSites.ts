import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';
import { safeJson } from '../utils/safeFetch';
import type { BindingSitesData, Pocket } from '../types';

/**
 * useBindingSites — fetches predicted binding sites for a complex.
 * Lazy-loads: only fetches when `enabled` is true.
 */
export function useBindingSites(complexId: string | undefined, enabled = false) {
  const [data, setData] = useState<BindingSitesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    if (!complexId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/complex/${encodeURIComponent(complexId)}/binding-sites`
      );
      const body = await safeJson(response);

      if (!response.ok) {
        throw new Error(body?.message || `Failed to load binding sites (HTTP ${response.status})`);
      }

      if (!body) {
        throw new Error('Server returned an empty response for binding sites');
      }

      setData(body);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred loading binding sites.');
    } finally {
      setLoading(false);
    }
  }, [complexId]);

  useEffect(() => {
    if (enabled && complexId) {
      fetchSites();
    }
  }, [enabled, complexId, fetchSites]);

  return {
    pockets: data?.pockets || [],
    totalPockets: data?.total_pockets || 0,
    monomerPockets: data?.monomer_pockets || [],
    monomerTotalPockets: data?.monomer_total_pockets || 0,
    interfaceCount: data?.interface_pocket_count || 0,
    comparison: data?.comparison || null,
    loading,
    error,
    refetch: fetchSites,
  };
}
