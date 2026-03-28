import { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export function useUndrugged(filter = 'all', limit = 25) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`${API_BASE}/undrugged`, window.location.origin);
        url.searchParams.append('filter', filter);
        url.searchParams.append('limit', limit);
        
        const response = await fetch(url.pathname + url.search);
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.message || 'Failed to load targets');
        }

        if (isMounted) {
          setData(body.data?.results || []);
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

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [filter, limit]);

  return { data, loading, error };
}
