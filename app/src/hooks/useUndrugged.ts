import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { safeJson } from '../utils/safeFetch';
import type { Complex } from '../types';

export function useUndrugged(filter = 'all', limit = 25) {
  const [data, setData] = useState<Complex[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${API_BASE}/undrugged`, window.location.origin);
        url.searchParams.append('filter', filter);
        url.searchParams.append('limit', String(limit));
        
        const response = await fetch(url.pathname + url.search);
        const body = await safeJson(response);

        if (!response.ok) {
          throw new Error(body?.message || `Failed to load targets (HTTP ${response.status})`);
        }

        if (isMounted) {
          setData(body?.results || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filter, limit]);

  return { data, loading, error };
}
