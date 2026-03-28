import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

// Module-level cache — persists across component mounts/unmounts
const complexCache = {};

export function useComplex(id) {
  const [complex, setComplex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || 'Failed to load complex details');
        }

        if (isMounted) {
          complexCache[id] = body.data;
          setComplex(body.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'An error occurred.');
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
