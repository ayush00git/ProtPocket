import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { safeJson } from '../utils/safeFetch';
import type { Complex } from '../types';

// Module-level cache — persists across component mounts/unmounts
const complexCache: Record<string, Complex> = {};

export function useComplex(id: string | undefined) {
  const [complex, setComplex] = useState<Complex | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Check cache first
    if (complexCache[id]) {
      setComplex(complexCache[id]);
      return;
    }

    let isMounted = true;
    
    const fetchComplex = async () => {
      setLoading(true);
      setError(null);
      setComplex(null);

      try {
        const response = await fetch(`${API_BASE}/complex/${encodeURIComponent(id)}`);
        const body = await safeJson(response);

        if (!response.ok) {
          throw new Error(body?.message || `Failed to load complex details (HTTP ${response.status})`);
        }

        if (!body) {
          throw new Error('Server returned an empty response');
        }

        if (isMounted) {
          complexCache[id] = body;
          setComplex(body);
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

    fetchComplex();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { complex, loading, error };
}
