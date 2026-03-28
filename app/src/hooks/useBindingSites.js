import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../config';

/**
 * useBindingSites — fetches predicted binding sites for a complex.
 * Lazy-loads: only fetches when `enabled` is true.
 *
 * @param {string} complexId — UniProt or AlphaFold ID
 * @param {boolean} enabled — whether to trigger the fetch
 * @param {boolean} showAll — whether to fetch all pockets without limit
 * @returns {{ pockets, totalPockets, interfaceCount, loading, error, refetch }}
 */
export function useBindingSites(complexId, enabled = false) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSites = useCallback(async () => {
    if (!complexId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/complex/${encodeURIComponent(complexId)}/binding-sites`
      );
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || 'Failed to load binding sites');
      }

      setData(body.data);
    } catch (err) {
      setError(err.message || 'An error occurred loading binding sites.');
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
